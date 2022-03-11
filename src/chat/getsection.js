const Section = require('../db/section')
var lastCommandTime = 0
var commandInterval = 60 // seconds

module.exports = {
    names: ["getsection", "s"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        const currentTime = new Date().getUTCSeconds()
        if (currentTime - lastCommandTime < commandInterval) return
        lastCommandTime = currentTime

        var gameString = await getCurrentGame()
        if (!gameString) {
            twitchChatClient.say(channel, localeObject.noGameSpecified)
            return
        }

        var responseString = subValues(localeObject.sectionListPre, { game: gameString })
        Section.find({ parent: gameString }, null, { sort: { created_at: 'asc' } }, (err, sectionList) => {
            if (err) {
                console.log(subValues(localeObject.errorGettingSectionList, { game: gameString }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
                return
            }

            sectionList.forEach((section) => {
                responseString += (section.name + localeObject.separator)
            })
            if (sectionList.length !== 0 ) {
                // Remove the last separator at the end
                responseString = responseString.slice(0, 0 - localeObject.separator.length)
            }
            responseString += subValues(localeObject.sectionListPost, { game: gameString })
            twitchChatClient.say(channel, responseString)
        })
    }
}