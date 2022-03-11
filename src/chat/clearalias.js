module.exports = {
    names: ["clearalias", "ac"],
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
            }
    
            section.aliasList = []
            try {
                await section.save()
                twitchChatClient.say(channel, subValues(localeObject.aliasListDeleted, { game: gameString, section: sectionQuery }))
            } catch (e2) {
                console.log(subValues(localeObject.errorDeletingAlias, { game: gameString, section: sectionQuery }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            }
        })
    }
}