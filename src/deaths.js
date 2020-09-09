const express = require('express')
const router = new express.Router()

const publicKey = process.env.PUBLIC_KEY
const privateKey = process.env.PRIVATE_KEY

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

// Adds a death to the specified section of the game
/* Query parameters:
   private_key: The private key of the API
   game: The game specified (Optional, defaults to the current game)
   section: The name of the section
*/
router.get('/adddeath', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    } else if (!req.query.section) {
        return res.send('There is no section specified.')
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send('There is no game currently specified.')
    }
    Section.findOne({ name: req.query.section, parent: game }, async (err, section) => {
        if (err) {
            console.log('An error occurred while finding the specified section, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send('The section specified could not be found.')
        }

        section.deaths += 1
        try {
            await section.save()
            return res.send('The death count for ' + req.query.section + ' is now ' + section.deaths)
        } catch (e) {
            console.log('An error occurred while adding a death, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        }
    })
})

// Removes a death from the specified section of the game
/* Query parameters:
   private_key: The private key of the API
   game: The game specified (Optional, defaults to the current game)
   section: The name of the section
*/
router.get('/removedeath', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    } else if (!req.query.section) {
        return res.send('There is no section specified.')
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send('There is no game currently specified.')
    }
    Section.findOne({ name: req.query.section, parent: game }, async (err, section) => {
        if (err) {
            console.log('An error occurred while finding the specified section, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send('The section specified could not be found.')
        }

        section.deaths -= 1
        if (section.deaths < 0) section.deaths = 0
        try {
            await section.save()
            return res.send('The death count for ' + req.query.section + ' is now ' + section.deaths)
        } catch (e) {
            console.log('An error occurred while adding a death, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        }
    })
})

// Gets the total number of deaths of a specified section of the game
/* Query parameters:
   public_key: The public key of the API
   game: The game specified (Optional, defaults to the current game)
   section: The name of the section
*/
router.get('/getdeath', async (req, res) => {
    if (!req.query.public_key || req.query.public_key !== publicKey) {
        return defaultError(res)
    } else if (!req.query.section) {
        return res.send('There is no section specified.')
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send('There is no game currently specified.')
    }
    Section.findOne({ name: req.query.section, parent: game }, (err, section) => {
        if (err) {
            console.log('An error occurred while finding the specified section, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send('The section specified could not be found.')
        }
        return res.send('The death count for ' + req.query.section + ' is ' + section.deaths + '.')
    })
})

// Sets the death count of a specified section to a specific amount
/* Query parameters:
   private_key: The private key of the API
   game: The game specified (Optional, defaults to the current game)
   content: The section followed by the death count, separated by a space bar.
            eg. 'Forgotten Crossroads 122'
*/
router.get('/setdeath', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    } else if (!req.query.content) {
        return res.send('There is no content specified.')
    }
    var splitContent = req.query.content.split(' ')
    var count = splitContent[splitContent.length - 1]
    var section = req.query.content.slice(0, 0 - count.length)
    if (section.length === 0) {
        return res.send('There is no section specified')
    } else if (isNaN(parseInt(count))) {
        return res.send('The count is not an integer.')
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send('There is no game currently specified.')
    }
    Section.findOne({ name: section, parent: game }, async (err, section) => {
        if (err) {
            console.log('An error occurred while finding the specified section, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send('The section specified could not be found.')
        }

        section.deaths = count
        try {
            await section.save()
            return res.send('The death count for ' + section + ' is ' + count + '.')
        } catch (e) {
            console.log('An error occurred while adding a death, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        }
    })
})

module.exports = router
