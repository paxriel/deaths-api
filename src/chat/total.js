const Section = require('../db/section')
var lastCommandTime = 0
var commandInterval = 60 // seconds

module.exports = {
    names: ["total", "t"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        const currentTime = new Date().getUTCSeconds()
        if (currentTime - lastCommandTime < commandInterval) return
        lastCommandTime = currentTime

        var gameString
        if (args.length == 0) {
            gameString = await getCurrentGame()
            if (!gameString) {
                twitchChatClient.say(channel, localeObject.noGameSpecified)
                return
            }
        } else {
            gameString = args.join(' ')
        }

        var total = 0
        Section.find({ parent: gameString }, null, { sort: { created_at: 'asc' } }, (err, sectionList) => {
            if (err) {
                console.log(subValues(localeObject.errorGettingSectionList, { game: gameString }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
                return
            }

            sectionList.forEach((section) => {
                total += section.deaths
            })
            twitchChatClient.say(channel, subValues(localeObject.totalDeaths, { game: gameString, deaths: total }))
        })
    }
}