const Section = require('../db/section')

module.exports = {
    names: ["removesection", "deletesection", "s-"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        if (!userIsMod) return

        var gameString = await getCurrentGame()
        if (!gameString) {
            twitchChatClient.say(channel, localeObject.noGameSpecified)
            return
        }
        var name = args.join(' ')
        if (!name.trim()) {
            twitchChatClient.say(channel, localeObject.noNameSpecified)
            return
        }

        Section.deleteOne({ $or: [{ name, parent: gameString }, { 'aliasList.alias': name, parent: gameString }] }, (err) => {
            if (err) {
                console.log(subValues(localeObject.errorDeletingSection, { game, section: name }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            } else {
                twitchChatClient.say(channel, subValues(localeObject.sectionDeleted, { game, section: name }))
            }
        })
    }
}