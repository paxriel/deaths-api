// Author: Paxriel (https://twitch.tv/paxriel)
const express = require('express')

require('./db/mongoose')
const gameRouter = require('./router/game')
const sectionRouter = require('./router/section')
const deathsRouter = require('./router/deaths')

const port = process.env.PORT || 4001
const app = express()

// No robots
app.get('/robots.txt', async (req, res) => {
    return res.send('User-agent: \*\nDisallow: /')
})

app.use(gameRouter)
app.use(sectionRouter)
app.use(deathsRouter)

app.get('*', (req, res) => {
    return res.send('Server is running')
})

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})