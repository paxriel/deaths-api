const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    isCurrent: {
        type: Boolean,
        default: true
    },
    personalBest: {
        type: String,
        default: "",
        trim: true
    }
})

const Game = mongoose.model('Game', gameSchema)

module.exports = Game