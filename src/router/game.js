const express = require('express')
const router = new express.Router()

const publicKey = process.env.PUBLIC_KEY
const privateKey = process.env.PRIVATE_KEY
const metricKey = process.env.METRIC_KEY
const refreshDuration = parseInt(process.env.REFRESH_DURATION) || 15

const Game = require('../db/game')
const Section = require('../db/section')

module.exports = function (localeObject, subValues, defaultError, getCurrentGame) {

// Gets the current game
/* Query parameters:
   public_key: The public key of the API
*/
router.get('/getgame', async (req, res) => {
    if (!req.query.public_key || req.query.public_key !== publicKey) {
        return defaultError(res)
    }
    Game.findOne({ isCurrent: true }, (err, game) => {
        if (err) {
            console.log(localeObject.errorFindingGame)
            console.log(err.stack)
            return defaultError(res)
        } else if (!game) {
            return res.send(localeObject.noGameSet)
        } else {
            return res.send(subValues(localeObject.currentGameSet, { game: game.name }))
        }
    })
})

// Set the current game
/* Query parameters:
   private_key: The private key of the API
   game: The game that will be set as the current game
*/
router.get('/setgame', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    } else if (!req.query.game) {
        return res.send(localeObject.noGameInQuery)
    }

    Game.findOne({ name: req.query.game }, async (e1, game) => {
        if (e1) {
            console.log(subValues(localeObject.errorFindingDuplicateGame, { game: req.query.game }))
            console.log(e1.stack)
            return defaultError(res)
        }
        
        try {
            // Disable current for the old game (Done in async, must be done before the new game is added)
            Game.findOne({ isCurrent: true }, async (e2, oldGame) => {
                if (e2) {
                    throw e2
                } else if (oldGame) {
                    oldGame.isCurrent = false
                    await oldGame.save()
                }
            })

            if (!game) {
                // Creates the new game and adds it
                const newGame = new Game({ name: req.query.game })
                await newGame.save()
            } else {
                // Enables the existing one
                game.isCurrent = true
                await game.save()
            }
            return res.send(subValues(localeObject.currentGameSet, { game: req.query.game }))
        } catch (e3) {
            console.log(subValues(localeObject.errorSettingCurrentGame, { game: req.query.game }))
            console.log(e3.stack)
            return defaultError(res)
        }
    })
})

// Deletes all sections in a game
/* Query parameters:
   private_key: The private key of the API
   game: The game data that will be cleared (Optional, defaults to the current game)
*/
router.get('/deletegame', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    Section.deleteMany({ parent: game }, (err) => {
        if (err) {
            console.log(subValues(localeObject.errorDeletingGameSections, { game }))
            console.log(err.stack)
            return defaultError(res)
        } else {
            return res.send(subValues(localeObject.gameSectionsDeleted, { game }))
        }
    })
})

// Gets the PB of the specific game
/* Query parameters:
   public_key: The public key of the API
   game: The game that the PB is requested from (Optional, defaults to the current game)
*/
router.get('/getpb', async (req, res) => {
    if (!req.query.public_key || req.query.public_key != publicKey) {
        return defaultError(res)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    Game.findOne({ name: game }, async (e1, gameObject) => {
        if (e1) {
            console.log(subValues(localeObject.errorFindingGame, { game }))
            console.log(e1.stack)
            return defaultError(res)
        } else if (!game) {
            return res.send(subValues(localeObject.missingGame, { game }))
        }

        return res.send(subValues(localeObject.personalBestGet, { game, pb: gameObject.personalBest }))
    })
})

// Sets the PB of the specific game
/* Query parameters:
   private_key: The private key of the API
   game: The game that the PB is will be set (Optional, defaults to the current game)
   pb: The PB value that will be set for the game.
*/
router.get('/setpb', async (req, res) => {
    if (!req.query.private_key || req.query.private_key != privateKey) {
        return defaultError(res)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    } else if (!req.query.pb) {
        return res.send(subValues(localeObject.noPBSpecified, { game }))
    }
    Game.findOne({ name: game }, async (e1, gameObject) => {
        if (e1) {
            console.log(subValues(localeObject.errorFindingGame, { game }))
            console.log(e1.stack)
            return defaultError(res)
        } else if (!game) {
            return res.send(subValues(localeObject.missingGame, { game }))
        }

        gameObject.personalBest = req.query.pb
        try {
            await gameObject.save()
            return res.send(subValues(localeObject.personalBestSet, { game, pb: gameObject.personalBest }))
        } catch (e2) {
            console.log(subValues(localeObject.errorSettingPB, { game }))
            return defaultError(res)
        }
    })
})

// Removes the PB of the specific game
/* Query parameters:
   private_key: The private key of the API
   game: The game that the PB will be removed (Optional, defaults to the current game)
*/
router.get('/deletepb', async (req, res) => {
    if (!req.query.private_key || req.query.private_key != privateKey) {
        return defaultError(res)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    Game.findOne({ name: game }, async (e1, gameObject) => {
        if (e1) {
            console.log(subValues(localeObject.errorFindingGame, { game }))
            console.log(e1.stack)
            return defaultError(res)
        } else if (!gameObject) {
            return res.send(subValues(localeObject.missingGame, { game }))
        }

        gameObject.personalBest = ""
        try {
            await gameObject.save()
            return res.send(subValues(localeObject.personalBestDelete, { game }))
        } catch (e2) {
            console.log(subValues(localeObject.errorDeletingPB, { game }))
            return defaultError(res)
        }
    })
})

// Gets the total amount of deaths in the specified game
/* Query parameters:
   public_key: The public key of the API
   game: The game specified (Optional, defaults to the current game)
*/
router.get('/total', async (req, res) => {
    if (!req.query.public_key || req.query.public_key != publicKey) {
        return defaultError(res)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }

    var total = 0
    Section.find({ parent: game }, null, { sort: { created_at: 'asc' } }, (err, sectionList) => {
        if (err) {
            console.log(subValues(localeObject.errorGettingSectionList, { game }))
            console.log(err.stack)
            return defaultError(res)
        }

        sectionList.forEach((section) => {
            total += section.deaths
        })
        return res.send(subValues(localeObject.totalDeaths, { game, deaths: total }))
    })
})

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

return router
}