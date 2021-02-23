const mongoose = require('mongoose')
const Stocks = require('./stocks')
const ObjectId = require('mongodb').ObjectId

class Mongo {
    constructor() {
        this.db = this.initDb()
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
    
    count() {
        return Stocks.countDocuments({})
    }

    simplePeFilter() {
        return Stocks.find({ $or: [{ trailingPe: { $gt: 0, $lt: 10 } }, { forwardPe: { $gt: 0, $lt: 10 } }], priceToBookRatio: { $gt: 0, $lt: 1.5 } }).sort({priceToBookRatio: 1}).lean().exec()
    }

    simpleEvToEbitaFilter() {
        return Stocks.find({evToEbitda: { $gt: 0, $lt: 10 }, priceToBookRatio: { $gt: 0, $lt: 1.5 } }).sort({priceToBookRatio: 1}).lean().exec()
    }

    simplePeFilterPlus() {
        return Stocks.aggregate([{ $addFields: { ratio: { $multiply: [ "$peRatio", "$priceToBookRatio" ] } } }, { $match: { ratio: { $lt: 12.5, $gt: 0 }, revenueTtm: { $gt: 100000000 } } }, { $sort: { ratio: 1 } } ])
    }

    simpleEvToEbitaFilterPlus() {
        return Stocks.aggregate([{ $addFields: { ratio: { $multiply: [ "$evToEbitda", "$priceToBookRatio" ] } } }, { $match: { ratio: { $lt: 7.5, $gt: 0 }, revenueTtm: { $gt: 100000000 }, peRatio: { $lt: 10 } } }, { $sort: { ratio: 1 } } ])
    }

    simpleGrowthFilter() {
        return Stocks.find({pegRatio: { $gt: 0, $lt: 1 }, profitMargin: { $gt: 0 }, revenueTtm: { $gt: 100000000 } }).sort({ pegRatio: 1 }).lean().exec()
    }

    hyperGrowth() {
        return Stocks.aggregate([{ $match: { profitMargin: { $gt: 20 }, quarterlyRevenueGrowthYoy: { $gt: 20 }, currentRatio: { $gt: 1 }, forwardPe: { $lt: 50, $gt: 0 } }}, { $sort: { quarterlyRevenueGrowthYoy: -1 } }])
    }

    superGrowth() {
        return Stocks.aggregate([{$match: {$and: [{ peRatio: { $gt: 0, $lt: 200 }}, {forwardPe: { $gt: 0, $lt: 50 }} ] }}, { $match: { profitMargin: { $gt: 20 }, quarterlyRevenueGrowthYoy: { $gt: 20 }, currentRatio: { $gt: 1 } }}, { $sort: { quarterlyRevenueGrowthYoy: -1 } }])
    }

    currentToForwardPe() {
        return Stocks.aggregate([{$match: {$and: [{ peRatio: { $gt: 0, $lt: 200 }}, {forwardPe: { $gt: 0, $lt: 10 }} ] }}, { $addFields: { ratio: { $divide: [ "$forwardPe", "$peRatio" ] } } }, { $match: { ratio: { $lt: 0.5, $gt: 0 }}}, { $sort: { ratio: 1 } }])
    }

    portfolio() {
        return Stocks.find({ticker: { $in: ['TTCF'] }}).lean().exec()
    }

}

module.exports = new Mongo()