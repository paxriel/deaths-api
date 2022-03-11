const Section = require('../db/section')

module.exports = {
    names: ["addalias", "a+"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        if (!userIsMod) return

        var gameString = await getCurrentGame()
        if (!gameString) {
            twitchChatClient.say(channel, localeObject.noGameSpecified)
            return
        }

        var aliasQuery = args[args.length - 1] || '' // Out of bounds will produce null
        var sectionQuery = args.join(' ').slice(0, 0 - aliasQuery.length)
        if (sectionQuery.length === 0) {
            twitchChatClient.say(channel, localeObject.noSectionSpecified)
            return
        } else if (aliasQuery.length === 0) {
            twitchChatClient.say(channel, localeObject.noAliasSpecified)
            return
        }

        Section.findOne({ $or: [{ name: sectionQuery, parent: gameString }, { 'aliasList.alias': sectionQuery, parent: gameString }] }, async (e1, section) => {
            if (e1) {
                console.log(subValues(localeObject.errorFindingSection, { game: gameString, section: sectionQuery }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
                return
            } else if (!section) {
                twitchChatClient.say(channel, subValues(localeObject.missingSection, { game: gameString, section: sectionQuery }))
                return
            } else if (aliasQuery === section.name) {
                twitchChatClient.say(channel, subValues(localeObject.aliasSameAsSection, { game: gameString, section: sectionQuery }))
                return
            }
            var duplicateAliasFound = false
            section.aliasList.forEach((alias) => {
                if (aliasQuery === alias) {
                    duplicateAliasFound = true
                    twitchChatClient.say(channel, subValues(localeObject.aliasAlreadyExists, { game: gameString, section: sectionQuery, alias: aliasQuery }))
                    return
                }
            })
            if (duplicateAliasFound) return null // Prevent further execution of this function
            section.aliasList = section.aliasList.concat({ alias: aliasQuery })
            try {
                await section.save()
                twitchChatClient.say(channel, subValues(localeObject.aliasAdded, { game: gameString, section: sectionQuery, alias: aliasQuery }))
            } catch (e2) {
                console.log(subValues(localeObject.errorAddingAlias, { game: gameString, section: sectionQuery, alias: aliasQuery }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            }
        })
    }
}