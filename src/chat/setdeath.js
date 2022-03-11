const Section = require('../db/section')

module.exports = {
    names: ["setdeath", "ds"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        if (!userIsMod) return

        var gameString = await getCurrentGame()
        if (!gameString) {
            twitchChatClient.say(channel, localeObject.noGameSpecified)
            return
        }
        var count = args[args.length - 1] || '' // Out of bounds will produce null
        if (args.length > 0) args.pop()
        var sectionQuery = args.join(' ')
        if (sectionQuery.length === 0) {
            twitchChatClient.say(channel, localeObject.noSectionSpecified)
            return
        } else if (isNaN(parseInt(count))) {
            twitchChatClient.say(channel, localeObject.countNotInteger)
            return
        }

        Section.findOne({ $or: [{ name: sectionQuery, parent: gameString }, { 'aliasList.alias': sectionQuery, parent: gameString }] }, async (err, section) => {
            if (err) {
                console.log(subValues(localeObject.errorFindingSection, { game: gameString, section: sectionQuery }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
                return
            } else if (!section) {
                twitchChatClient.say(channel, subValues(localeObject.missingSection, { game: gameString, section: sectionQuery }))
                return
            }
    
            section.deaths = count
            try {
                await section.save()
                twitchChatClient.say(channel, subValues(localeObject.sectionDeathChange, { game: gameString, section: sectionQuery, deaths: count }))
            } catch (e) {
                console.log(subValues(localeObject.errorSettingDeath, { game: gameString, section: sectionQuery, deaths: count }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            }
        })
    }
}