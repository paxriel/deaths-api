// Author: Paxriel (https://twitch.tv/paxriel)
const express = require('express')
const fs = require('fs')
var localeObject = checkLocale()

const Game = require('./db/game')

// Checks whether the locale specified exists
function checkLocale() {
    const localeSpecified = process.env.LOCALE || 'en-gb'
    try {
        const currentObject = fs.readFileSync(`./locales/${localeSpecified}.json`)
        return JSON.parse(currentObject)
    } catch (e) {
        // No translation is available for this line as the locales file could not be found, so there could not be any 
        console.log(`Locale ${localeSpecified} missing or could not be opened, stack trace below`)
        console.log(e.stack)
        process.exit(20)
    }
}

// Check whether all the specified keys exists
function checkKeys() {
    if (!process.env.PRIVATE_KEY) {
        console.log(localeObject.privateKeyMissing)
        process.exit(21)
    } else if (!process.env.PUBLIC_KEY) {
        console.log(localeObject.publicKeyMissing)
        process.exit(21)
    } else if (!process.env.METRIC_KEY) {
        console.log(localeObject.metricKeyMissing)
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

checkKeys()
require('./db/mongoose')(localeObject)
const gameRouter = require('./router/game')(localeObject, subValues, defaultError, getCurrentGame)
const sectionRouter = require('./router/section')(localeObject, subValues, defaultError, getCurrentGame)
const deathsRouter = require('./router/deaths')(localeObject, subValues, defaultError, getCurrentGame)

const port = process.env.PORT || 4001
const app = express()

// No robots
app.get('/robots.txt', async (req, res) => {
    return res.send('User-agent: \*\nDisallow: /')
})

app.use(gameRouter)
app.use(sectionRouter)
app.use(deathsRouter)

app.get('*', (req, res) => {
    return res.send(localeObject.serverRunning)
})

app.listen(port, () => {
    const startString = localeObject.serverStarted || ''
    console.log(startString.replace(/\${port}/g, port))
})