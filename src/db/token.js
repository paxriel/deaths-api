const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    id: {
        // Only 2 possible values: 0 (Bot) and 1 (Broadcaster)
        type: Number,
        default: -1
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    expiresIn: {
        type: Number,
        default: 0
    },
    obtainmentTimestamp: {
        type: Number,
        default: 0
    }
})

const Token = mongoose.model('Token', tokenSchema)

module.exports = Token