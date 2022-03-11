const Section = require('../db/section')

module.exports = {
    names: ["removegame", "deletegame"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        if (!userIsMod) return

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

        Section.deleteMany({ parent: gameString }, (err) => {
            if (err) {
                console.log(subValues(localeObject.errorDeletingGameSections, { game: gameString }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            } else {
                twitchChatClient.say(channel, subValues(localeObject.gameSectionsDeleted, { game: gameString }))
            }
        })
    }
}