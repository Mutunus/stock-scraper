
const express = require('express')
const app = express()
const port = 3000
const Main = require('./main')
const db = require('./db')

app.get('/ping', async (req, res) => {
    res.status(200).send('pong')
})

app.get('/count', async (req, res) => {
    const totalNumOfDocs = await db.count()
    res.status(200).json(totalNumOfDocs)
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

app.get('/hyper-growth', async (req, res) => {
    const stocks = await db.hyperGrowth()
    res.status(200).json(stocks)
})

app.get('/super-growth', async (req, res) => {
    const stocks = await db.superGrowth()
    res.status(200).json(stocks)
})

app.get('/current-forward-pe', async (req, res) => {
    const stocks = await db.currentToForwardPe()
    res.status(200).json(stocks)
})

app.get('/portfolio', async (req, res) => {
    const stocks = await db.portfolio()
    res.status(200).json(stocks)
})

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
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