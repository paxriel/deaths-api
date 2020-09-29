const mongoose = require('mongoose')

module.exports = function (localeObject) {
    if (!process.env.MONGODB_URL) {
        console.log(localeObject.mongoDBURLMissing)
        process.exit(21)
    }
    mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
}