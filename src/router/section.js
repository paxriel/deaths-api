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
            responseString += (section.name + localeObject.separator)
        })
        if (sectionList.length !== 0 ) {
            // Remove the last separator at the end
            responseString = responseString.slice(0, 0 - localeObject.separator.length)
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
   name: The name of the section that would be added (Alias can be used)
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
    Section.deleteOne({ $or: [{ name: req.query.name, parent: game }, { 'aliasList.alias': req.query.name, parent: game }] }, (err) => {
        if (err) {
            console.log(subValues(localeObject.errorDeletingSection, { game, section: req.query.name }))
            console.log(err.stack)
            return defaultError(res)
        } else {
            return res.send(subValues(localeObject.sectionDeleted, { game, section: req.query.name }))
        }
    })
})

// Gets the list of alias for a section
/* Query parameters:
   public_key: The public key of the API
   game: The game that the section belongs to (Optional, defaults to the current game)
   section: The section that is requested (Alias can be used)
*/
router.get('/getalias', async (req, res) => {
    if (!req.query.public_key || req.query.public_key !== publicKey) {
        return defaultError(res)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    } else if (!req.query.section) {
        return res.send(localeObject.noSectionSpecified)
    }
    Section.findOne({ $or: [{ name: req.query.section, parent: game }, { 'aliasList.alias': req.query.section, parent: game }] }, (err, section) => {
        if (err) {
            console.log(subValues(localeObject.errorFindingSection, { game, section: req.query.section }))
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send(subValues(localeObject.missingSection, { game, section: req.query.section }))
        } else if (section.aliasList.length === 0) {
            return res.send(subValues(localeObject.aliasListEmpty, { game, section: section.name }))
        }

        var responseString = subValues(localeObject.sectionListPre, { game, section: section.name })
        section.aliasList.forEach((alias) => {
            responseString += (alias + localeObject.separator)
        })
        // Remove the last separator at the end
        responseString = responseString.slice(0, 0 - localeObject.separator.length)
        responseString += subValues(localeObject.sectionListPost, { game, section: section.name })
        return res.send(responseString)
    })
})

// Adds an alias for a section
/* Query parameters:
   private_key: The private key of the API
   game: The game that the section belongs to (Optional, defaults to the current game)
   content: The section followed by the alias, separated by a space bar.
            eg. 'Power Source ps'.
            An alias for the section can be read. The alias that will be added should not contain a space bar.
*/
router.get('/addalias', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    } else if (!req.query.section) {
        return res.send(localeObject.noSectionSpecified)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    } else if (!req.query.content) {
        return res.send(localeObject.noContentSpecified)
    }
    var splitContent = req.query.content.split(' ')
    var aliasQuery = splitContent[splitContent.length - 1] || '' // Out of bounds will produce null
    var sectionQuery = req.query.content.slice(0, 0 - aliasQuery.length)
    if (sectionQuery.length === 0) {
        return res.send(localeObject.noSectionSpecified)
    } else if (aliasQuery.length === 0) {
        return res.send(localeObject.noAliasSpecified)
    }
    Section.findOne({ $or: [{ name: sectionQuery, parent: game }, { 'aliasList.alias': sectionQuery, parent: game }] }, async (e1, section) => {
        if (e1) {
            console.log(subValues(localeObject.errorFindingSection, { game, section: sectionQuery }))
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send(subValues(localeObject.missingSection, { game, section: sectionQuery }))
        } else if (aliasQuery === section.name) {
            return res.send(subValues(localeObject.aliasSameAsSection, { game, section: sectionQuery }))
        }
        var duplicateAliasFound = false
        section.aliasList.forEach((alias) => {
            if (aliasQuery === alias) {
                duplicateAliasFound = true
                return res.send(subValues(localeObject.aliasAlreadyExists, { game, section: sectionQuery, alias: aliasQuery }))
            }
        })
        if (duplicateAliasFound) return null // Prevent further execution of this function
        section.aliasList = section.aliasList.concat({ alias: aliasQuery })
        try {
            await section.save()
            return res.send(subValues(localeObject.aliasAdded, { game, section: sectionQuery, alias: aliasQuery }))
        } catch (e2) {
            console.log(subValues(localeObject.errorAddingAlias, { game, section: sectionQuery, alias: aliasQuery }))
            console.log(err.stack)
            return defaultError(res)
        }
    })
})

// Removes an alias for a section
/* Query parameters:
   private_key: The private key of the API
   game: The game that the section belongs to (Optional, defaults to the current game)
   content: The section followed by the alias, separated by a space bar.
            eg. 'Power Source ps'.
            An alias for the section can be read. The alias should not contain a space bar.
*/
router.get('/removealias', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    } else if (!req.query.section) {
        return res.send(localeObject.noSectionSpecified)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    } else if (!req.query.content) {
        return res.send(localeObject.noContentSpecified)
    }
    var splitContent = req.query.content.split(' ')
    var aliasQuery = splitContent[splitContent.length - 1] || '' // Out of bounds will produce null
    var sectionQuery = req.query.content.slice(0, 0 - aliasQuery.length)
    if (sectionQuery.length === 0) {
        return res.send(localeObject.noSectionSpecified)
    } else if (aliasQuery.length === 0) {
        return res.send(localeObject.noAliasSpecified)
    }
    Section.findOne({ $or: [{ name: sectionQuery, parent: game }, { 'aliasList.alias': sectionQuery, parent: game }] }, async (e1, section) => {
        if (e1) {
            console.log(subValues(localeObject.errorFindingSection, { game, section: sectionQuery }))
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send(subValues(localeObject.missingSection, { game, section: sectionQuery }))
        } else if (aliasQuery === section.name) {
            return res.send(subValues(localeObject.aliasSameAsSection, { game, section: sectionQuery }))
        }
        var aliasFound = false
        for (var i = 0; i < section.aliasList.length; i++) {
            if (section.aliasList[i] === aliasQuery) {
                aliasFound = true
                section.aliasList.splice(i, 1)
                break
            }
        }
        if (!aliasFound) {
            return res.send(subValues(localeObject.missingAlias, { game, section: sectionQuery, alias: aliasQuery }))
        }
        try {
            await section.save()
            return res.send(subValues(localeObject.aliasRemoved, { game, section: sectionQuery, alias: aliasQuery }))
        } catch (e2) {
            console.log(subValues(localeObject.errorDeletingAlias, { game, section: sectionQuery, alias: aliasQuery }))
            console.log(err.stack)
            return defaultError(res)
        }
    })
})

// Clears the alias list for a section
/* Query parameters:
   private_key: The private key of the API
   game: The game that the section belongs to (Optional, defaults to the current game)
   section: The section that will be cleared (Alias can be used)
*/
router.get('/clearalias', async (req, res) => {
    if (!req.query.private_key || req.query.private_key !== privateKey) {
        return defaultError(res)
    } else if (!req.query.section) {
        return res.send(localeObject.noSectionSpecified)
    }
    var game = req.query.game || await getCurrentGame()
    if (!game) {
        return res.send(localeObject.noGameSpecified)
    } else if (!req.query.section) {
        return res.send(localeObject.noSectionSpecified)
    }
    Section.findOne({ $or: [{ name: req.query.section, parent: game }, { 'aliasList.alias': req.query.section, parent: game }] }, async (e1, section) => {
        if (e1) {
            console.log(subValues(localeObject.errorFindingSection, { game, section: req.query.section }))
            console.log(err.stack)
            return defaultError(res)
        } else if (!section) {
            return res.send(subValues(localeObject.missingSection, { game, section: req.query.section }))
        }

        section.aliasList = []
        try {
            await section.save()
            return res.send(subValues(localeObject.aliasListDeleted, { game, section: req.query.section }))
        } catch (e2) {
            console.log(subValues(localeObject.errorDeletingAlias, { game, section: req.query.section }))
            console.log(err.stack)
            return defaultError(res)
        }
    })
})

return router
}