const mongoose = require('mongoose')

const balanceSheetReportSchema = new mongoose.Schema({
    fiscalDateEnding: String,
    totalAssets: Number,
    totalLiabilities: Number,
    totalShareholderEquity: Number,
    deferredLongTermLiabilities: Number,
    totalCurrentLiabilities: Number,
    totalNonCurrentLiabilities: Number,
    shortTermDebt: Number,
    currentLongTermDebt: Number,
    totalCurrentAssets: Number,
    totalNonCurrentAssets: Number,
    longTermDebt: Number,
    totalLongTermDebt: Number,
    capitalSurplus: Number,
    liabilitiesAndShareholderEquity: Number,
    cashAndShortTermInvestments: Number,
    commonStockSharesOutstanding: Number,
    accountPayable: Number,
    inventory: Number
}) 

const stockSchema = new mongoose.Schema({
    // general
    lastUpdated: Date,
    
    // alpha vantage overview
    ticker: [{
        type: String,
        unqiue: true,
        index: true
    }],
    name: String,
    description: String,
    sector: String,
    industry: String,
    latestQuarter: String,
    marketCapitalization: Number,
    trailingPe: Number,
    forwardPe: Number,
    peRatio: Number,
    pegRatio: Number,
    bookValue: Number,
    eps: Number,
    profitMargin: Number,
    dividendPerShare: Number,
    dividendYield: Number,
    priceToBookRatio: Number,
    analystTargetPrice: Number,
    priceToSalesRatioTtm: Number,
    sharesOutstanding: Number,
    percentInsiders: Number,
    percentInstitutions: Number,
    forwardAnnualDividendRate: Number,
    forwardAnnualDividendYield: Number,
    dilutedEpsttm: Number,
    returnOnEquityTTM: Number,
    operatingMarginTtm: Number,
    payoutRatio: Number,
    quarterlyEarningsGrowthYoy: Number,
    quarterlyRevenueGrowthYoy: Number,
    revenueTtm: Number,
    revenuePerShareTtm: Number,
    ebitda: Number,
    evToEbitda: Number,
    returnOnAssets: Number,
    returnOnEquity: Number,


    // alpha vantage balance sheet
    annualReports: [balanceSheetReportSchema],
    quarterlyReports: [balanceSheetReportSchema],

    // yahoo
    stockPrice: Number,
    stockPriceDate: Date,
    stockPriceChange: Number,
    previousCloseValue: Number,
    currentRatio: Number,
    cash: Number,
    cashPerShare: Number,
    // cash that's generated from normal business operations or activities
    operatingCashFlow: Number,
    // the amount of cash a business has after it has met its financial obligations
    leveredCashFlow: Number

})

module.exports = mongoose.model('Stocks', stockSchema)