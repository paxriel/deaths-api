const mongoose = require('mongoose')

const sectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    parent: {
        type: String,
        required: true,
        trim: true
    },
    deaths: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Death count should be a positive integer')
            }
        }
    },
    aliasList: [{
        alias: {
            type: String,
            required: true
        }
    }]
}, { timestamps: { created_at: 'created_at' } })

const Section = mongoose.model('Section', sectionSchema)

module.exports = Section