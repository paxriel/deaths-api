const Section = require('../db/section')
var lastCommandTime = 0
var commandInterval = 30 // seconds

module.exports = {
    names: ["getalias", "a"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        const currentTime = Math.floor(Date.now() / 1000)
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
                return
            } else if (!section) {
                twitchChatClient.say(channel, subValues(localeObject.missingSection, { game: gameString, section: sectionString }))
                return
            } else if (section.aliasList.length === 0) {
                twitchChatClient.say(channel, subValues(localeObject.aliasListEmpty, { game, section: section.name }))
                return
            }
    
            var responseString = subValues(localeObject.sectionListPre, { game, section: section.name })
            section.aliasList.forEach((alias) => {
                responseString += (alias + localeObject.separator)
            })
            // Remove the last separator at the end
            responseString = responseString.slice(0, 0 - localeObject.separator.length)
            responseString += subValues(localeObject.sectionListPost, { game, section: section.name })
            twitchChatClient.say(channel, responseString)
        })
    }
}