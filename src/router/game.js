const express = require('express')
const router = new express.Router()

const publicKey = process.env.PUBLIC_KEY
const privateKey = process.env.PRIVATE_KEY
const metricKey = process.env.METRIC_KEY
const refreshDuration = parseInt(process.env.REFRESH_DURATION) || 15

const Game = require('../db/game')
const Section = require('../db/section')

// Default error message
function defaultError(res) {
    return res.send('An unexpected error occurred.')
}

// Get the current game
async function getCurrentGame() {
    var promise = new Promise((resolve, reject) => {
        Game.findOne({ isCurrent: true }, (err, game) => {
            if (err) {
                console.log('An error occurred while finding the current game, stack trace below')
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
            console.log('An error occurred while finding the current game, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        } else if (!game) {
            return res.send('No game has been set as the current game.')
        } else {
            return res.send('Current game on death counter: ' + game.name)
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
        return res.send('No game is specified in the query.')
    }

    Game.findOne({ name: req.query.game }, async (e1, game) => {
        if (e1) {
            console.log('An error occurred while finding a duplicate game, stack trace below')
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
            return res.send('The current game has been set to ' + req.query.game + '.')
        } catch (e3) {
            console.log('An error occurred while setting the current game, stack trace below')
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
        return res.send('There is no game currently specified.')
    }
    Section.deleteMany({ parent: game }, (err) => {
        if (err) {
            console.log('An error occurred while deleting sections from a game, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        } else {
            return res.send('All sections from ' + game + ' have been deleted.')
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
        return res.send('The game specified is missing.')
    }

    var total = 0
    Section.find({ parent: game }, null, { sort: { created_at: 'asc' } }, (err, sectionList) => {
        if (err) {
            console.log('An error occurred while getting the section list, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        }

        sectionList.forEach((section) => {
            total += section.deaths
        })
        return res.send('Total deaths for ' + game + ': ' + total)
    })
})

// Gets the metrics for the specified game in HTML form
/* Query parameters:
   metric_key: The metric key of the API
   game: The game specified (Optional, defaults to the current game)
   show_total: Whether the total amount will be shown (Optional, defaults to true)
*/
router.get('/metrics', async (req, res) => {
    if (!req.query.metric_key || req.query.metric_key != metricKey) {
        return defaultError(res)
    }
    var game = req.query.game || await getCurrentGame()
    var show_total = true
    if (req.query.show_total) {
        show_total = (req.query.show_total === "true")
    }
    if (!game) {
        return res.send('The game specified is missing.')
    }
    var response = `<!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="${refreshDuration}">
            <title>Death Counter for ${game}</title>
        </head>
        <body>
            <h3>Death counter for ${game}</h3>`
    var total = 0
    Section.find({ parent: game }, null, { sort: { created_at: 'asc' } }, (err, sectionList) => {
        if (err) {
            console.log('An error occurred while getting the section list, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        }

        sectionList.forEach((section) => {
            response += `<p>${section.name}: ${section.deaths}</p>`
            total += section.deaths
        })
        if (show_total) {
            response += `<p>Total deaths: ${total}</p>`
        }
        response += '</body></html>'
        return res.send(response)
    })
})

module.exports = router
