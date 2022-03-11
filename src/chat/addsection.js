const Section = require('../db/section')

module.exports = {
    names: ["addsection", "s+"],
    async execute(channel, twitchChatClient, userIsMod, args, localeObject, subValues, getCurrentGame) {
        if (!userIsMod) return

        var gameString = await getCurrentGame()
        if (!gameString) {
            twitchChatClient.say(channel, localeObject.noGameSpecified)
            return
        }
        var name = args.join(' ')
        if (name.trim() === '') {
            twitchChatClient.say(channel, localeObject.noNameSpecified)
            return
        }

        Section.findOne({ name, parent: gameString }, async (err, section) => {
            if (err) {
                console.log(subValues(localeObject.errorCheckingDuplicateSections, { game: gameString, section: name }))
                console.log(err.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
                return
            } else if (section) {
                twitchChatClient.say(channel, subValues(localeObject.sectionAlreadyExists, { game: gameString, section: name }))
                return
            }
    
            var newSection = new Section({ name, parent: gameString })
            try {
                await newSection.save()
                twitchChatClient.say(channel, subValues(localeObject.sectionAdded, { game: gameString, section: name }))
            } catch (e) {
                console.log(subValues(localeObject.errorAddingSection, { game: gameString, section: name }))
                console.log(e.stack)
                twitchChatClient.say(channel, localeObject.unexpectedError)
            }
        })
    }
}