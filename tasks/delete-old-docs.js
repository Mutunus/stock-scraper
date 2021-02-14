const moment = require('moment')
const { getDayMilliseconds } = require('./tasks.util')

class DeleteOldDocuments {
    constructor(db) {
        this.db = db;
    }

    init() {
        setInterval(this.deleteOldDocuments, getDayMilliseconds())
    }

    // delete stocks that have not been updated in a month
    deleteOldDocuments = async () => {
        const monthAgo = moment()
        .subtract(1, 'month')
        .toDate()
        const outDatedStocks = await this.db.getStocksOlderThanDate(monthAgo);
        await this.db.deleteStocks(outDatedStocks.map(stock => stock.ticker))
    }


}

module.exports = DeleteOldDocuments;