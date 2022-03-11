const Section = require('../db/section')
var lastCommandTime = 0
var commandInterval = 10 // seconds

module.exports = {
    names: ["getdeath", "d"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        const currentTime = new Date().getUTCSeconds()
        if (currentTime - lastCommandTime < commandInterval) return
        lastCommandTime = currentTime

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
        Section.findOne({ $or: [{ name: sectionString, parent: gameString }, { 'aliasList.alias': sectionString, parent: gameString }] }, (err, section) => {
            if (err) {
                console.log(subValues(localeObject.errorFindingSection, { game: gameString, section: sectionString }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            } else if (!section) {
                twitchChatClient.say(channel, subValues(localeObject.missingSection, { game: gameString, section: sectionString }))
            } else {
                twitchChatClient.say(channel, subValues(localeObject.sectionDeathGet, { game: gameString, section: sectionString, deaths: section.deaths }))
            }
        })
    }
}