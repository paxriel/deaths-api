const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    id: {
        // Placeholder to use as sort of a PK
        type: Number,
        default: 0
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