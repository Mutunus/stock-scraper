const mongoose = require('mongoose')
const Stocks = require('./stocks')
const ObjectId = require('mongodb').ObjectId

class Mongo {
    constructor() {
        this.db = this.initDb()
        console.log('mongo create')
    }

    initDb() {
        try {
            mongoose.connect('mongodb://localhost:27017/stocks', { useNewUrlParser: true }).then(() => console.log('connected to db'))
            return mongoose.connection

        } catch (err) {
            console.error(err);
        }
    }

    upsertStock(stock) {
        const stockWithDate = { ...stock, lastUpdated: new Date() }
        this.db.collection('stocks').update({ ticker: stockWithDate.ticker }, { $set: stockWithDate }, { upsert: true })
    }

    deleteStocks(tickers) {
      return Stocks.deleteMany({ "ticker": { "$in": tickers } })
    }

    getStocksOlderThanDate(date) {
        return Stocks.find({ "lastUpdated": { "$lte": date } }).lean().exec()
    }

    // find 
    simplePeFilter() {
        return Stocks.find({ $or: [{ trailingPe: { $gt: 0, $lt: 15 } }, { forwardPe: { $gt: 0, $lt: 15 } }], priceToBookRatio: { $gt: 0, $lt: 1.5 } }).sort({priceToBookRatio: 1}).lean().exec()
    }

    simpleEvToEbitaFilter() {
        return Stocks.find({evToEbitda: { $gt: 0, $lt: 10 }, priceToBookRatio: { $gt: 0, $lt: 1.5 } }).sort({priceToBookRatio: 1}).lean().exec()
    }

    simplePeFilterPlus() {
        return Stocks.aggregate([{ $addFields: { ratio: { $multiply: [ "$peRatio", "$priceToBookRatio" ] } } }, { $match: { ratio: { $lt: 12.5, $gt: 0 }, revenueTtm: { $gt: 100000000 } } }, { $sort: { ratio: 1 } } ])
    }

    simpleEvToEbitaFilterPlus() {
        return Stocks.aggregate([{ $addFields: { ratio: { $multiply: [ "$evToEbitda", "$priceToBookRatio" ] } } }, { $match: { ratio: { $lt: 7.5, $gt: 0 }, revenueTtm: { $gt: 100000000 } } }, { $sort: { ratio: 1 } } ])
    }

    simpleGrowthFilter() {
        return Stocks.find({pegRatio: { $gt: 0, $lt: 1 }, profitMargin: { $gt: 0 } }).sort({ pegRatio: 1 }).lean().exec()
    }

}

module.exports = new Mongo()