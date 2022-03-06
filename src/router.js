const express = require('express')
const router = new express.Router()

const metricKey = process.env.METRIC_KEY
const refreshDuration = parseInt(process.env.REFRESH_DURATION) || 15

const Game = require('./db/game')
const Section = require('./db/section')

module.exports = function (localeObject, subValues, defaultError, getCurrentGame) {

// Gets the metrics for the specified game in HTML form
/* Query parameters:
   metric_key: The metric key of the API
   game: The game specified (Optional, defaults to the current game)
   show_total: Whether the total amount will be shown (Optional, defaults to true)
   show_pb: Whether the personal best will be shown (Optional, defaults to true)
*/
router.get('/metrics', async (req, res) => {
    if (!req.query.metric_key || req.query.metric_key != metricKey) {
        return defaultError(res)
    }
    var game = req.query.game || await getCurrentGame()
    var show_total = true, show_pb = true
    if (req.query.show_total) {
        show_total = (req.query.show_total === "true")
    }
    if (req.query.show_pb) {
        show_pb = (req.query.show_pb === "true")
    }
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    var response = `<!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="${refreshDuration}">
            <title>${subValues(localeObject.metricsTitle, { game })}</title>
        </head>
        <body>
            <h3 class="title">${subValues(localeObject.metricsTitle, { game })}</h3>`
    var total = 0
    Section.find({ parent: game }, null, { sort: { created_at: 'asc' } }, (err, sectionList) => {
        if (err) {
            console.log(subValues(localeObject.errorGettingSectionList, { game }))
            console.log(err.stack)
            return defaultError(res)
        }

        sectionList.forEach((section) => {
            response += `<p class="section">${subValues(localeObject.metricsSection, { game, section: section.name, deaths: section.deaths })}</p>`
            total += section.deaths
        })
        if (show_total) {
            response += `<p class="total">${subValues(localeObject.metricsTotalDeaths, { game: game, deaths: total })}</p>`
        }
        // Show the PB if needed, but always perform the search
        Game.findOne({ name: game }, (err, gameObject) => {
            if (err) {
                console.log(subValues(localeObject.errorFindingGame, { game }))
                console.log(err.stack)
                return defaultError(res)
            } else if (!gameObject) {
                console.log(subValues(localeObject.missingGame, { game }))
                return defaultError(res)
            }
            if (show_pb) {
                response += `<p class="pb">${subValues(localeObject.metricsPB, { game, pb: gameObject.personalBest })}</p>`
            }

            // Returns the response
            response += '</body></html>'
            return res.send(response)
        })
    })
})

// No robots
router.get('/robots.txt', async (req, res) => {
    return res.send('User-agent: \*\nDisallow: /')
})

return router
}