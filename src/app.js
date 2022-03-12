// Author: Paxriel (https://twitch.tv/paxriel)
const { ApiClient } = require('@twurple/api')
const { ChatClient } = require('@twurple/chat')
const { RefreshingAuthProvider } = require('@twurple/auth')
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
var twitchApiClient, twitchChatClient, botTokenObj, channelTokenObj
var commandsObj = {}
var modsList = []

const commandFiles = fs.readdirSync('./src/chat').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
	const command = require(`./chat/${file}`)
    command.names.forEach((commandName) => commandsObj[commandName] = command)
}

async function startBot() {
    Token.findOne({ id: 0 }, async (err, tokenObj) => {
        if (err) {
            console.log(err.stack)
            return
        }

        const botTokenReference = {
            accessToken: process.env.TWITCH_BOT_ACCESS,
            refreshToken: process.env.TWITCH_BOT_REFRESH,
            expiresIn: 0,
            obtainmentTimestamp: 0
        }
        if (tokenObj) {
            botTokenObj = tokenObj
            if (process.env.OVERWRITE_BOT_TOKEN) {
                botTokenObj.accessToken = botTokenReference.accessToken
                botTokenObj.refreshToken = botTokenReference.refreshToken
                botTokenObj.expiresIn = botTokenReference.expiresIn
                botTokenObj.obtainmentTimestamp = botTokenReference.obtainmentTimestamp

                try {
                    await botTokenObj.save()
                } catch (e) {
                    console.log(localeObject.errorAddingToken)
                    console.log(e.stack)
                    return
                }
            } else {
                botTokenReference.accessToken = tokenObj.accessToken
                botTokenReference.refreshToken = tokenObj.refreshToken
                botTokenReference.expiresIn = tokenObj.expiresIn
                botTokenReference.obtainmentTimestamp = tokenObj.obtainmentTimestamp
            }
        } else {
            botTokenObj = new Token(botTokenReference)
            botTokenObj.id = 0
            try {
                await botTokenObj.save()
            } catch (e) {
                console.log(localeObject.errorAddingToken)
                console.log(e.stack)
                return
            }
        }

        await initApiClient(botTokenReference)
    })
}

async function initApiClient(botTokenReference) {
    Token.findOne({ id: 1 }, async (err, tokenObj) => {
        if (err) {
            console.log(err.stack)
            return
        }

        // Yes this code can definitely be refactored, but since only 2 tokens are needed,
        // this is the easiest way to do this for now
        const channelTokenReference = {
            accessToken: process.env.TWITCH_CHANNEL_ACCESS,
            refreshToken: process.env.TWITCH_CHANNEL_REFRESH,
            expiresIn: 0,
            obtainmentTimestamp: 0
        }
        if (tokenObj) {
            channelTokenObj = tokenObj
            if (process.env.OVERWRITE_CHANNEL_TOKEN) {
                channelTokenObj.accessToken = channelTokenReference.accessToken
                channelTokenObj.refreshToken = channelTokenReference.refreshToken
                channelTokenObj.expiresIn = channelTokenReference.expiresIn
                channelTokenObj.obtainmentTimestamp = channelTokenReference.obtainmentTimestamp

                try {
                    await channelTokenObj.save()
                } catch (e) {
                    console.log(localeObject.errorAddingToken)
                    console.log(e.stack)
                    return
                }
            } else {
                channelTokenReference.accessToken = tokenObj.accessToken
                channelTokenReference.refreshToken = tokenObj.refreshToken
                channelTokenReference.expiresIn = tokenObj.expiresIn
                channelTokenReference.obtainmentTimestamp = tokenObj.obtainmentTimestamp
            }
        } else {
            channelTokenObj = new Token(channelTokenReference)
            channelTokenObj.id = 1
            try {
                await channelTokenObj.save()
            } catch (e) {
                console.log(localeObject.errorAddingToken)
                console.log(e.stack)
                return
            }
        }

        var channelAuthProvider = new RefreshingAuthProvider({ 
            clientId: process.env.TWITCH_CLIENT_ID, 
            clientSecret: process.env.TWITCH_CLIENT_SECRET,
            onRefresh: async newTokenData => {
                // channelTokenReference only used at start, no need for constant update
                channelTokenObj.accessToken = newTokenData.accessToken
                channelTokenObj.refreshToken = newTokenData.refreshToken
                channelTokenObj.expiresIn = newTokenData.expiresIn
                channelTokenObj.obtainmentTimestamp = newTokenData.obtainmentTimestamp
                try {
                    await channelTokenObj.save()
                } catch (e) {
                    console.log(localeObject.errorAddingToken)
                    console.log(`accessToken: ${channelTokenObj.accessToken}\nrefreshToken: ${channelTokenObj.refreshToken}`)
                    console.log(e.stack)
                }
            }
        }, channelTokenReference)
        twitchApiClient = new ApiClient({ authProvider: channelAuthProvider })
        await initModsUpdate()
        await initChatClient(botTokenReference)
    })
}

async function initChatClient(botTokenReference) {
    // Auth provider for chat
    var botAuthProvider = new RefreshingAuthProvider({ 
        clientId: process.env.TWITCH_CLIENT_ID, 
        clientSecret: process.env.TWITCH_CLIENT_SECRET,
        onRefresh: async newTokenData => {
            // botTokenReference only used at start, no need for constant update
            botTokenObj.accessToken = newTokenData.accessToken
            botTokenObj.refreshToken = newTokenData.refreshToken
            botTokenObj.expiresIn = newTokenData.expiresIn
            botTokenObj.obtainmentTimestamp = newTokenData.obtainmentTimestamp
            try {
                await botTokenObj.save()
            } catch (e) {
                console.log(localeObject.errorAddingToken)
                console.log(`accessToken: ${botTokenObj.accessToken}\nrefreshToken: ${botTokenObj.refreshToken}`)
                console.log(e.stack)
            }
        }
    }, botTokenReference)

    // Set up the listener for chat events
    twitchChatClient = new ChatClient({ authProvider: botAuthProvider, channels: [process.env.TWITCH_CHANNEL] })
    twitchChatClient.onMessage(handleMessage)
    twitchChatClient.onConnect(() => { console.log(localeObject.twitchConnectionSuccess) })
    twitchChatClient.onNoPermission((channel, message) => { console.log(localeObject.twitchPermissionDenied) })
    try {
        console.log(1)
        await twitchChatClient.connect()
        console.log(2)
        await initModsUpdate()
    } catch (e) {
        console.log(localeObject.errorConnectingTwitch)
        console.log(e.stack)
        return
    }
}

async function handleMessage(channel, user, message, msg) {
    if (!/^![a-zA-Z+-]*($| .*$)/.test(message)) return

    var userIsMod = false
    modsList.forEach((mod) => {
        if (mod === user) {
            userIsMod = true
        }
    })

    var messageContents = message.substring(1).trim().split(' ')
    const command = messageContents[0].toLowerCase()
    messageContents.shift()
    
    if (!commandsObj[command]) return
    try {
        await commandsObj[command].execute(channel, twitchChatClient, userIsMod, messageContents, localeObject, subValues, getCurrentGame)
    } catch (e) {
        console.log(localeObject.errorExecutingCommand)
        console.log(e.stack)
        return
    }
}

async function initModsUpdate() {
    const channelUser = await twitchApiClient.users.getUserByName(process.env.TWITCH_CHANNEL)
    if (!channelUser) {
        console.log(localeObject.noUserFound)
        return
    }
    const cacheDuration = process.env.TWITCH_CACHE ? parseInt(process.env.TWITCH_CACHE) : 10
    const tempModsList = await twitchApiClient.moderation.getModerators(channelUser.id)
    modsList = [ process.env.TWITCH_CHANNEL ]
    tempModsList.data.forEach((mod) => {
        modsList.push(mod.userName)
    })
    console.log(localeObject.modListRetrieved)
    console.log(modsList)
    setInterval(async () => {
        const tempModsList = await twitchApiClient.moderation.getModerators(channelUser.id)
        modsList = [ process.env.TWITCH_CHANNEL]
        tempModsList.data.forEach((mod) => {
            modsList.push(mod.userName)
        })
    }, cacheDuration * 60 * 1000)
}

if (!process.env.ENABLE_AUTH_ROUTES) startBot()