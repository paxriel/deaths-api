const Game = require('../db/game')
var lastCommandTime = 0
var commandInterval = 10 // seconds

module.exports = {
    names: ["getpb", "pb"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        const currentTime = Math.floor(Date.now() / 1000)
        if (currentTime - lastCommandTime < commandInterval) return
        lastCommandTime = currentTime

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
    
            twitchChatClient.say(channel, subValues(localeObject.personalBestGet, { game, pb: gameObject.personalBest }))
        })
    }
}