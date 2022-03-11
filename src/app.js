// Author: Paxriel (https://twitch.tv/paxriel)
const { ChatClient } = require('@twurple/chat');
const { RefreshingAuthProvider } = require('@twurple/auth');
const express = require('express')
const fs = require('fs')
var localeObject = checkLocale()

const Game = require('./db/game')
const Token = require('./db/token')

// Checks whether the locale specified exists
function checkLocale() {
    const localeSpecified = process.env.LOCALE || 'en-gb'
    try {
        const currentObject = fs.readFileSync(`./locales/${localeSpecified}.json`)
        console.log(`Locale ${localeSpecified} successfully loaded`)
        return JSON.parse(currentObject)
    } catch (e) {
        // No translation is available for this line as the locales file could not be found, so there could not be any 
        console.log(`Locale ${localeSpecified} missing or could not be opened, stack trace below`)
        console.log(e.stack)
        process.exit(20)
    }
}

// Check whether all the specified environment variables exists
function checkEnvVars() {
    if (!process.env.METRIC_KEY) {
        console.log(localeObject.metricKeyMissing)
        process.exit(21)
    } else if (!process.env.TWITCH_CHANNEL) {
        console.log(localeObject.twitchChannelMissing)
        process.exit(21)
    } else if (!process.env.TWITCH_ACCESS) {
        console.log(localeObject.twitchAccessMissing)
        process.exit(21)
    } else if (!process.env.TWITCH_REFRESH) {
        console.log(localeObject.twitchRefreshMissing)
        process.exit(21)
    } else if (!process.env.TWITCH_CLIENT_ID) {
        console.log(localeObject.twitchIdMissing)
        process.exit(21)
    } else if (!process.env.TWITCH_CLIENT_SECRET) {
        console.log(localeObject.twitchSecretMissing)
        process.exit(21)
    } else if (process.env.TWITCH_CACHE_DURATION && !parseInt(process.env.TWITCH_CACHE_DURATION)) {
        console.log(localeObject.invalidTwitchCacheDuration)
        process.exit(21)
    }
}

// Substitute a specific string with the given arguments into a different language
function subValues(original='', valuesObject={}) {
    return original.replace(/\${game}/g, valuesObject.game).replace(/\${section}/g, valuesObject.section)
    .replace(/\${deaths}/g, valuesObject.deaths).replace(/\${pb}/g, valuesObject.pb).replace(/\${alias}/g, valuesObject.alias)
}

// Default error message
function defaultError(res) {
    return res.send(localeObject.unexpectedError)
}

// Get the current game
async function getCurrentGame() {
    var promise = new Promise((resolve, reject) => {
        Game.findOne({ isCurrent: true }, (err, game) => {
            if (err) {
                console.log(localeObject.errorFindingGame)
                console.log(err.stack)
                resolve(null)
            } else if (!game) {
                resolve(null)
            } else {
                resolve(game.name)
            }
        })
    })
    return promise
}

checkEnvVars()
require('./db/mongoose')(localeObject)

/* ROUTER SECTION */

const mainRouter = require('./router')(localeObject, subValues, defaultError, getCurrentGame)
const port = process.env.PORT || 4001
const app = express()

app.use((req, res, next) => {
    for (var key in req.query) {
        if (/<\/?[a-z][\s\S]*>/i.test(req.query[key])) {
            return res.send(localeObject[noHTMLTagAllowed])
        }
    }
    next()
})

app.use(mainRouter)

app.get('*', (req, res) => {
    return res.send(localeObject.serverRunning)
})

app.listen(port, () => {
    const startString = localeObject.serverStarted || ''
    console.log(startString.replace(/\${port}/g, port))
})

/* TWITCH BOT SECTION */

// Set up commands
var commandsObj = {}
const commandFiles = fs.readdirSync('./chat').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
	const command = require(`./chat/${file}`)
    command.names.forEach((commandName) => commandsObj[commandName] = command)
}

async function startBot() {
    var twitchAuthProvider, twitchChatClient
    const tokenRefObj = {
        accessToken: process.env.TWITCH_ACCESS,
	    refreshToken: process.env.TWITCH_REFRESH,
	    expiresIn: 0,
	    obtainmentTimestamp: 0
    }
    Token.findOne({ id: 0 }, async (err, tokenObj) => {
        if (err) {
            console.log(localeObject.errorCheckingDuplicateSections)
            console.log(err.stack)
            return
        }

        var tokenMongooseObj
        if (tokenObj) {
            tokenMongooseObj = tokenObj
            tokenRefObj.accessToken = tokenObj.accessToken
            tokenRefObj.refreshToken = tokenObj.refreshToken
            tokenRefObj.expiresIn = tokenObj.expiresIn
            tokenRefObj.obtainmentTimestamp = tokenObj.obtainmentTimestamp
        } else {
            tokenMongooseObj = new Token(tokenObj)
            try {
                await tokenMongooseObj.save()
            } catch (e) {
                console.log(localeObject.errorAddingToken)
                console.log(e.stack)
                return
            }
        }

        twitchAuthProvider = new RefreshingAuthProvider({ 
            clientId: process.env.TWITCH_CLIENT_ID, 
            clientSecret: process.env.TWITCH_CLIENT_SECRET,
            onRefresh: async newTokenData => {
                // tokenRefObj only used at start, no need for constant update
                tokenMongooseObj.accessToken = newTokenData.accessToken
                tokenMongooseObj.refreshToken = newTokenData.refreshToken
                tokenMongooseObj.expiresIn = newTokenData.expiresIn
                tokenMongooseObj.obtainmentTimestamp = newTokenData.obtainmentTimestamp
                try {
                    await tokenMongooseObj.save()
                } catch (e) {
                    console.log(localeObject.errorAddingToken)
                    console.log(`accessToken: ${tokenMongooseObj.accessToken}\nrefreshToken: ${tokenMongooseObj.refreshToken}`)
                    console.log(e.stack)
                }
            }
        }, tokenRefObj)

        // Cache the mod list and update it at regular intervals (in mins)
        const cacheDuration = process.env.TWITCH_CACHE ? parseInt(process.env.TWITCH_CACHE) : 10
        var modsList = []

        // Set up the listener for chat events
        twitchChatClient = new ChatClient({ twitchAuthProvider, channels: [process.env.TWITCH_CHANNEL] })
        twitchChatClient.onMessage(async (channel, user, message, msg) => {
            if (!/^![a-zA-Z+-]*($| .*$)/.test(message)) return

            var userIsMod = false
            modsList.forEach((mod) => {
                if (mod === user) {
                    userIsMod = true
                }
            })

            args = message.substring(1).trim().split(' ')
            command = messageContents[0]
            messageContents.shift()
            
            if (!commandsObj[command]) return
            try {
                await commandsObj[command].execute(channel, twitchChatClient, userIsMod, messageContents, localeObject, subValues, getCurrentGame)
            } catch (e) {
                console.log(localeObject.errorExecutingCommand)
                console.log(e.stack)
                return
            }
        })
        try {
            await twitchChatClient.connect()
            setInterval(() => {
                modsList = await twitchChatClient.getMods(process.env.TWITCH_CHANNEL)
            }, cacheDuration * 60 * 1000)
        } catch (e) {
            console.log(localeObject.errorConnectingTwitch)
            console.log(e.stack)
            return
        }
    })
}

startBot()