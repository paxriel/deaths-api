const Game = require('../db/game')
var lastCommandTime = 0
var commandInterval = 60 // seconds

module.exports = {
    names: ["getgame", "g", "game"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        const currentTime = new Date().getUTCSeconds()
        if (currentTime - lastCommandTime < commandInterval) return
        lastCommandTime = currentTime
        Game.findOne({ isCurrent: true }, (err, game) => {
            if (err) {
                console.log(localeObject.errorFindingGame)
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            } else if (!game) {
                twitchChatClient.say(channel, localeObject.noGameSet)
            } else {
                twitchChatClient.say(channel, subValues(localeObject.currentGameSet, { game: game.name }))
            }
        })
    }
}