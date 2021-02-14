
const express = require('express')
const app = express()
const port = 3000
const Main = require('./main')
const db = require('./db')

app.get('/ping', async (req, res) => {
    res.status(200).send('pong')
})

app.get('/pe-filter', async (req, res) => {
    const stocks = await db.simplePeFilter()
    res.status(200).json(stocks)
})

app.get('/ev-ebitda-filter', async (req, res) => {
    const stocks = await db.simpleEvToEbitaFilter()
    res.status(200).json(stocks)
})

app.get('/pe-filter-plus', async (req, res) => {
    const stocks = await db.simplePeFilterPlus()
    res.status(200).json(stocks)
})

app.get('/ev-ebitda-filter-plus', async (req, res) => {
    const stocks = await db.simpleEvToEbitaFilterPlus()
    res.status(200).json(stocks)
})

app.get('/simple-growth-filter', async (req, res) => {
    const stocks = await db.simpleGrowthFilter()
    res.status(200).json(stocks)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

const main = new Main();
main.init()


// TODO 

// deploy to AWS
// install and start mongo service in AWS
// proxy robo mongo at AWS hosted mongo
// DockerFile
// test REST endpoints in container respond
// DockerFile point at local mongo
// get domain
// frontend