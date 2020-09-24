const express = require('express')
const router = new express.Router()

const publicKey = process.env.PUBLIC_KEY
const privateKey = process.env.PRIVATE_KEY

const Section = require('../db/section')

module.exports = function (localeObject, subValues, defaultError, getCurrentGame) {
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
        return res.send(localeObject.noGameSpecified)
    }
    var responseString = subValues(localeObject.sectionListPre, { game })
    Section.find({ parent: game }, null, { sort: { created_at: 'asc' } }, (err, sectionList) => {
        if (err) {
            console.log(subValues(localeObject.errorGettingSectionList, { game }))
            console.log(err.stack)
            return defaultError(res)
        }

        sectionList.forEach((section) => {
            responseString += (section.name + ', ')
        })
        if (sectionList.length !== 0 ) {
            // Remove the last ', ' at the end
            responseString = responseString.slice(0, -2)
        }
        responseString += subValues(localeObject.sectionListPost, { game })
        return res.send(responseString)
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
        return res.send(localeObject.noNameSpecified)
    }

    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    Section.findOne({ name: req.query.name, parent: game }, async (err, section) => {
        if (err) {
            console.log(subValues(localeObject.errorCheckingDuplicateSections, { game, section: req.query.name }))
            console.log(err.stack)
            return defaultError(res)
        } else if (section) {
            return res.send(subValues(localeObject.sectionAlreadyExists, { game, section: req.query.name }))
        }

        var newSection = new Section({
            name: req.query.name,
            parent: game
        })
        try {
            await newSection.save()
            return res.send(subValues(localeObject.sectionAdded, { game, section: req.query.name }))
        } catch (e) {
            console.log(subValues(localeObject.errorAddingSection, { game, section: req.query.name }))
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
        return res.send(localeObject.noNameSpecified)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    Section.deleteOne({ name: req.query.name, parent: game }, (err) => {
        if (err) {
            console.log(subValues(localeObject.errorDeletingSection, { game, section: req.query.name }))
            console.log(err.stack)
            return defaultError(res)
        } else {
            return res.send(subValues(localeObject.sectionDeleted, { game, section: req.query.name }))
        }
    })
})

return router
}
