const Section = require('../db/section')

module.exports = {
    names: ["removedeath", "deletedeath", "d-"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        if (!userIsMod) return

        var gameString = await getCurrentGame()
        if (!gameString) {
            twitchChatClient.say(channel, localeObject.noGameSpecified)
            return
        }
        var sectionString = args.join(' ')
        if (sectionString.trim() === '') {
            twitchChatClient.say(channel, localeObject.noSectionSpecified)
            return
        }

        Section.findOne({ $or: [{ name: sectionString, parent: gameString }, { 'aliasList.alias': sectionString, parent: gameString }] }, async (err, section) => {
            if (err) {
                console.log(subValues(localeObject.errorFindingSection, { game: gameString, section: sectionString }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
                return
            } else if (!section) {
                twitchChatClient.say(channel, subValues(localeObject.missingSection, { game: gameString, section: sectionString }))
                return
            }
    
            section.deaths -= 1
            if (section.deaths < 0) section.deaths = 0
            try {
                await section.save()
                twitchChatClient.say(channel, subValues(localeObject.sectionDeathChange, { game: gameString, section: sectionString, deaths: section.deaths }))
            } catch (e) {
                console.log(subValues(localeObject.errorRemovingDeath, { game: gameString, section: sectionString, deaths: section.deaths }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            }
        })
    }
}