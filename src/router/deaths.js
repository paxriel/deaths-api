const express = require('express')
const router = new express.Router()

const publicKey = process.env.PUBLIC_KEY
const privateKey = process.env.PRIVATE_KEY

const Section = require('../db/section')

module.exports = module.exports = function (localeObject, subValues, defaultError, getCurrentGame) {
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
        return res.send(localeObject.noSectionSpecified)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    Section.findOne({ name: req.query.section, parent: game }, async (err, section) => {
        if (err) {
            console.log(subValues(localeObject.errorFindingSection, { game, section: req.query.section }))
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send(subValues(localeObject.missingSection, { game, section: req.query.section }))
        }

        section.deaths += 1
        try {
            await section.save()
            return res.send(subValues(localeObject.sectionDeathChange, { game, section: req.query.section, deaths: section.deaths }))
        } catch (e) {
            console.log(subValues(localeObject.errorAddingDeath, { game, section: req.query.section, deaths: section.deaths }))
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
        return res.send(localeObject.noSectionSpecified)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    Section.findOne({ name: req.query.section, parent: game }, async (err, section) => {
        if (err) {
            console.log(subValues(localeObject.errorFindingSection, { game, section: req.query.section }))
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send(subValues(localeObject.missingSection, { game, section: req.query.section }))
        }

        section.deaths -= 1
        if (section.deaths < 0) section.deaths = 0
        try {
            await section.save()
            return res.send(subValues(localeObject.sectionDeathChange, { game, section: req.query.section, deaths: section.deaths }))
        } catch (e) {
            console.log(subValues(localeObject.errorRemovingDeath, { game, section: req.query.section, deaths: section.deaths }))
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
        return res.send(localeObject.noSectionSpecified)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    Section.findOne({ name: req.query.section, parent: game }, (err, section) => {
        if (err) {
            console.log(subValues(localeObject.errorFindingSection, { game, section: req.query.section }))
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send(subValues(localeObject.missingSection, { game, section: req.query.section }))
        }
        return res.send(subValues(localeObject.sectionDeathGet, { game, section: req.query.section, deaths: section.deaths }))
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
        return res.send(localeObject.noContentSpecified)
    }
    var splitContent = req.query.content.split(' ')
    var count = splitContent[splitContent.length - 1]
    var sectionQuery = req.query.content.slice(0, 0 - count.length)
    if (sectionQuery.length === 0) {
        return res.send(localeObject.noSectionSpecified)
    } else if (isNaN(parseInt(count))) {
        return res.send(localeObject.countNotInteger)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    }
    Section.findOne({ name: sectionQuery, parent: game }, async (err, section) => {
        if (err) {
            console.log(subValues(localeObject.errorFindingSection, { game, section: sectionQuery }))
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send(subValues(localeObject.missingSection, { game, section: sectionQuery }))
        }

        section.deaths = count
        try {
            await section.save()
            return res.send(subValues(localeObject.sectionDeathChange, { game, section: sectionQuery, deaths: count }))
        } catch (e) {
            console.log(subValues(localeObject.errorSettingDeath, { game, section: sectionQuery, deaths: count }))
            console.log(err.stack)
            return defaultError(res)
        }
    })
})

return router
}
