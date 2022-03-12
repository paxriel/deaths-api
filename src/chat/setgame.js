const Game = require('../db/game')

module.exports = {
    names: ["setgame"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        if (!userIsMod) return

        if (args.length == 0) {
            twitchChatClient.say(channel, localeObject.noGameInQuery)
            return
        }

        var gameString = args.join(' ')
        Game.findOne({ name: gameString }, async (e1, game) => {
            if (e1) {
                console.log(subValues(localeObject.errorFindingDuplicateGame, { game: gameString }))
                console.log(e1.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
                return
            }
            
            try {
                // Disable current for the old game (Done in async, must be done before the new game is added)
                Game.findOne({ isCurrent: true }, async (e2, oldGame) => {
                    if (e2) {
                        throw e2
                    } else if (oldGame) {
                        oldGame.isCurrent = false
                        await oldGame.save()
                    }
                })
    
                if (!game) {
                    // Creates the new game and adds it
                    const newGame = new Game({ name: gameString })
                    await newGame.save()
                } else {
                    // Enables the existing one
                    game.isCurrent = true
                    await game.save()
                }
                twitchChatClient.say(channel, subValues(localeObject.currentGameSet, { game: gameString }))
            } catch (e3) {
                console.log(subValues(localeObject.errorSettingCurrentGame, { game: gameString }))
                console.log(e3.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            }
        })
    }
}