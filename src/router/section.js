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

// Gets the total amount of sections in the game (Without deaths)
/* Query parameters:
   public_key: The public key of the API
   game: The game for the total amount of sections (Optional, defaults to the current game)
*/
router.get('/getsection', async (req, res) => {
    if (!req.query.public_key || req.query.public_key !== publicKey) {
        return defaultError(res)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send('There is no game currently specified.')
    }
    var responseString = 'The sections in ' + game + ' are '
    Section.find({ parent: game }, null, { sort: { created_at: 'asc' } }, (err, sectionList) => {
        if (err) {
            console.log('An error occurred while getting the section list, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        }

        sectionList.forEach((section) => {
            responseString += (section.name + ', ')
        })
        if (sectionList.length === 0 ) {
            return res.send(responseString)
        } else {
            // Remove the last ', ' at the end
            return res.send(responseString.slice(0, -2))
        }
    })
})

// Adds a section to the game
/* Query parameters:
   private_key: The private key of the API
   game: The game for the total amount of sections (Optional, defaults to the current game)
   name: The name of the section that would be added
*/
router.get('/addsection', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    } else if (!req.query.name) {
        return res.send('no name specified')
    }

    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send('There is no game currently specified.')
    }
    Section.findOne({ name: req.query.name, parent: game }, async (err, section) => {
        if (err) {
            console.log('An error occurred while checking for duplicate sections, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        } else if (section) {
            return res.send('The specified section already exists.')
        }

        var newSection = new Section({
            name: req.query.name,
            parent: game
        })
        try {
            await newSection.save()
            return res.send('Section ' + req.query.name + ' added to ' + game + '.')
        } catch (e) {
            console.log('An error occurred while saving a new section, stack trace below')
            console.log(e.stack)
            return defaultError(res)
        }
    })
})

// Removes a section from the game
/* Query parameters:
   private_key: The private key of the API
   game: The game for the total amount of sections (Optional, defaults to the current game)
   name: The name of the section that would be added
*/
router.get('/removesection', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    } else if (!req.query.name) {
        return res.send('No name is specified')
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send('There is no game currently specified.')
    }
    Section.deleteOne({ name: req.query.name, parent: game }, (err) => {
        if (err) {
            console.log('An error occurred while deleting a section, stack trace below')
            console.log(err.stack)
            return defaultError(res)
        } else {
            return res.send('Section ' + req.query.name + ' from ' + game + ' is deleted.')
        }
    })
})

module.exports = router