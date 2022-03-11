const Game = require('../db/game')

module.exports = {
    names: ["removepb", "deletepb", "pb-"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        if (!userIsMod) return
        
        var gameString = await getCurrentGame()
        if (!gameString) {
            twitchChatClient.say(channel, localeObject.noGameSpecified)
            return
        }

        Game.findOne({ name: gameString }, async (e1, gameObject) => {
            if (e1) {
                console.log(subValues(localeObject.errorFindingGame, { game: gameString }))
                console.log(e1.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
                return
            } else if (!gameObject) {
                twitchChatClient.say(channel, subValues(localeObject.missingGame, { game: gameString }))
                return
            }

            gameObject.personalBest = ""
            try {
                await gameObject.save()
                twitchChatClient.say(channel, subValues(localeObject.personalBestDelete, { game: gameString }))
            } catch (e2) {
                console.log(subValues(localeObject.errorDeletingPB, { game }))
                twitchChatClient.say(channel, localeObject.unexpectedError)
            }
        })
    }
}