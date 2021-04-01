const key = '09YMPLBD3P7F4SD3'
const fetch = require('node-fetch');
const fs = require('fs')
const readline = require('readline');
const _ = require('lodash')
const { wait } = require('./utils')
const puppeteer = require('puppeteer');
const path = require('path');

class ScrapeYahoo {
    constructor(db) {
        this.db = db
    }

    async init() {
        console.log('STOCK DATA COLLECTION STARTING', new Date().toLocaleString('en-NZ'))
        this.tickers = await this.getTickers()
        const chunkedTickers = this.splitTickersIntoChunks(_.clone(this.tickers), 2, 500)
        await Promise.all(
            [
                //this.getDataPerChunk(chunkedTickers),
                this.scrapeDataFromYahoo(this.tickers)
            ]
        )
        console.log('STOCK DATA COLLECTION COMPLETED', new Date().toLocaleString('en-NZ'))
        // wait 8 hours
        await wait(28800000)
        this.init()
    }

    async getTickers() {
        const nyse = await this.getTickersFromFile('NYSE.txt')
        const nasdaq = await this.getTickersFromFile('NASDAQ.txt')
        const amex = await this.getTickersFromFile('AMEX.txt')
        const otc = await this.loadOtcTickers()

        return this.shuffleTickers([...nyse, ...nasdaq, ...amex, ...otc])
    }

    splitTickersIntoChunks(tickers, chunkSize, maxLength) {
        const slicedTickers = tickers.slice(0, maxLength)
        return _.chunk(slicedTickers, chunkSize)
    }

    shuffleTickers(tickers) {
        let currentIndex = tickers.length, temporaryValue, randomIndex;
        while (0 !== currentIndex) {
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex -= 1;
          // And swap it with the current element.
          temporaryValue = tickers[currentIndex];
          tickers[currentIndex] = tickers[randomIndex];
          tickers[randomIndex] = temporaryValue;
        }
        return tickers;
      }

    async getTickersFromFile(fileName) {
        const filePath = path.resolve(`./${fileName}`)
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity
        });
        const res = []

        for await (const line of rl) {
            const [ticker] = line.split('\t')
            res.push(ticker)
        }
        res.shift()
        return res
    }

    async loadOtcTickers() {
        const filePath = path.resolve(`./otc_markets.csv`)
        const fileStream = fs.createReadStream(filePath); 
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
          });
        const res = []

        for await (const line of rl) {
            const [ticker] = line.split(',')
            res.push(ticker)
        }
        res.shift()
        console.log(res[0])
        return res
    }

    async getDataPerChunk(tickerChunks) {
        for await (const chunk of tickerChunks) {
            await this.getCompanyAlphaVantageData(chunk)
            await wait(60000)
        }
    }

    async getCompanyAlphaVantageData(tickers) {
        for await (const ticker of tickers) {
            const overview = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${key}`).then(res => res.json())
            const balanceSheet = await fetch(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${key}`).then(res => res.json())

            // if we have called API too many time already, then wait
            if(overview.Note || balanceSheet.Note) {
                wait(60000)
                return
            }

            console.log(`${ticker}: ALPHA VANTAGE DATA`)

            const formattedOverview = this.formatValues(overview)
            const formattedBalanceSheet = this.formatBalanceSheet(balanceSheet)

            const data = { ...formattedOverview, ...formattedBalanceSheet }

            if(!_.isEmpty(data)) {
                this.db.upsertStock(data)
            }
        }
    }

    formatValues(stock) {
        return _.reduce(stock, (acc, val, key) => {
            acc[_.camelCase(key)] = this.getFieldVal(val)
            return acc
        }, {})
    }

    formatBalanceSheet(balanceSheet) {
        if(_.isEmpty(balanceSheet)) return
        const formattedQuart = _.get(balanceSheet, 'quarterlyReports', []).map(report => (this.formatValues(report)))
        const formattedAnnual = _.get(balanceSheet, 'annualReports', []).map(report => (this.formatValues(report)))
        return { annualReports: formattedAnnual, quarterlyReports: formattedQuart }
    }

    getFieldVal(val) {
        if(val === 'None') return null
        return isNaN(val) ? val : parseFloat(val)
    }


    async scrapeDataFromYahoo(tickers) {
        const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
        const page = await browser.newPage();

        for await (const ticker of tickers) {
            try {
                console.log(`${ticker}: YAHOO DATA`)

                // navigate to summary page
                await page.goto(`https://nz.finance.yahoo.com/quote/${ticker}?p=${ticker}`);
    
                if(page.url().includes('lookup')) {
                    console.error('could not find ticker page for: ', ticker)
                    continue
                }
    
                const normalHoursStockPrice = await page.evaluate(() => 
                    document.getElementsByClassName('Trsdu(0.3s) Fw(b) Fz(36px) Mb(-4px) D(ib)')[0].innerText
                ).catch(e => console.log(`Unable to get stock price for ${ticker}`))
    
                const afterHoursStockPrice = await page.evaluate(() => 
                     document.getElementsByClassName('C($primaryColor) Fz(24px) Fw(b)')[0].innerText
                ).catch(e => null)
    
    
                const previousCloseValue = await page.evaluate(() => 
                    document.querySelector('[data-test=PREV_CLOSE-value] span').innerText
                ).catch(e => console.log(`Unable to get previous close stock price for ${ticker}`))
    
                const peRatio = await page.evaluate(() => 
                    document.querySelector('[data-test=PE_RATIO-value] span').innerText
                ).catch(e => console.log(`Unable to get peRatio for ${ticker}`))
    
                const eps = await page.evaluate(() => 
                    document.querySelector('[data-test=EPS_RATIO-value] span').innerText
                ).catch(e => console.log(`Unable to get eps for ${ticker}`))
    
    
                // navigate to statistics page
                await wait(_.random(100, 200))
                await page.goto(`https://nz.finance.yahoo.com/quote/${ticker}/key-statistics?p=${ticker}`);
    
                if(!page.url().includes('key-statistics')) {
                    console.error('could not find statistics page for:', ticker)
                    continue
                }
    
                const trailingPeRow  = await page.evaluateHandle(() => document.querySelectorAll('table tbody tr')[2]);
                const trailingPe = await trailingPeRow.evaluate(x => x.querySelector('td:nth-child(2)').innerText).catch(x => null);
                trailingPeRow.dispose();
    
                const forwardPeRow  = await page.evaluateHandle(() => document.querySelectorAll('table tbody tr')[3]);
                const forwardPe = await forwardPeRow.evaluate(x => x.querySelector('td:nth-child(2)').innerText).catch(x => null);
                forwardPeRow.dispose();
                
                const pegRatioRow = await page.evaluateHandle(() => document.querySelectorAll('table tbody tr')[4]);
                const pegRatio = await pegRatioRow.evaluate(x => x.querySelector('td:nth-child(2)').innerText).catch(x => null);
                pegRatioRow.dispose();
    
                const priceToSalesRatioRow = await page.evaluateHandle(() => document.querySelectorAll('table tbody tr')[5]);
                const priceToSalesRatioTtm = await priceToSalesRatioRow.evaluate(x => x.querySelector('td:nth-child(2)').innerText).catch(x => null);
                priceToSalesRatioRow.dispose();
    
                const priceToBookRatioRow = await page.evaluateHandle(() => document.querySelectorAll('table tbody tr')[6]);
                const priceToBookRatio = await priceToBookRatioRow.evaluate(x => x.querySelector('td:nth-child(2)').innerText).catch(x => null);
                priceToBookRatioRow.dispose();
    
                const evToEbitdaRow = await page.evaluateHandle(() => document.querySelectorAll('table tbody tr')[8]);
                const evToEbitda = await evToEbitdaRow.evaluate(x => x.querySelector('td:nth-child(2)').innerText).catch(x => null);
                evToEbitdaRow.dispose();
    
                const profitMarginRow = await page.evaluateHandle(() => document.querySelectorAll('table tbody tr')[39]);
                const profitMargin = await profitMarginRow.evaluate(x => x.querySelector('td:nth-child(2)').innerText).catch(x => null);
                profitMarginRow.dispose();
    
                const operatingMarginRow = await page.evaluateHandle(() => document.querySelectorAll('table tbody tr')[40]);
                const operatingMargin = await operatingMarginRow.evaluate(x => x.querySelector('td:nth-child(2)').innerText).catch(x => null);
                operatingMarginRow.dispose();
    
                const financialHighlights = await page.evaluateHandle(() => document.querySelector('[data-test=qsp-statistics] div:nth-child(3) div:nth-child(4) table'))
                const revenue = await financialHighlights.evaluate(x => x.querySelector('tr:nth-child(1) td:nth-child(2)').innerText).catch(x => null)
                const revenuePerShareTtm = await financialHighlights.evaluate(x => x.querySelector('tr:nth-child(2) td:nth-child(2)').innerText).catch(x => null);
                const ebitda = await financialHighlights.evaluate(x => x.querySelector('tr:nth-child(5) td:nth-child(2)').innerText).catch(x => null);
                const quarterlyRevenueGrowthYoy = await financialHighlights.evaluate(x => x.querySelector('tr:nth-child(3) td:nth-child(2)').innerText).catch(x => null);
                financialHighlights.dispose();

                const balanceSheet = await page.evaluateHandle(() => document.querySelector('[data-test=qsp-statistics] div:nth-child(3) div:nth-child(5) table'))
                const cash = await balanceSheet.evaluate(x => x.querySelector('tr:nth-child(1) td:nth-child(2)').innerText).catch(x => null)
                const cashPerShare = await balanceSheet.evaluate(x => x.querySelector('tr:nth-child(2) td:nth-child(2)').innerText).catch(x => null)
                const currentRatio = await balanceSheet.evaluate(x => x.querySelector('tr:nth-child(5) td:nth-child(2)').innerText).catch(x => null)
                balanceSheet.dispose();

                const cashFlow = await page.evaluateHandle(() => document.querySelector('[data-test=qsp-statistics] div:nth-child(3) div:nth-child(6) table'))
                const operatingCashFlow = await cashFlow.evaluate(x => x.querySelector('tr:nth-child(1) td:nth-child(2)').innerText).catch(x => null)
                const leveredCashFlow = await cashFlow.evaluate(x => x.querySelector('tr:nth-child(2) td:nth-child(2)').innerText).catch(x => null)
                cashFlow.dispose();

                // TODO - get cash and current ratio
    
                // navigate to profile page
                await wait(_.random(100, 200))
                await page.goto(`https://nz.finance.yahoo.com/quote/${ticker}/profile?p=${ticker}`);
    
                if(!page.url().includes('profile')) {
                    console.error('could not find profile page for: ', ticker)
                    continue
                }
    
                const industryInfo = await page.evaluateHandle(() => document.querySelector('[data-test=qsp-profile] p:nth-child(2)'))
                const sector = await industryInfo.evaluate(x => x.querySelector('span:nth-child(2)').innerText).catch(x => null)
                const industry = await industryInfo.evaluate(x => x.querySelector('span:nth-child(5)').innerText).catch(x => null)
    
                const stockPrice = parseFloat(afterHoursStockPrice || normalHoursStockPrice)
                const parsedPreviousCloseValue = parseFloat(previousCloseValue)
                const stockPriceData = {
                    ticker,
                    sector,
                    industry,
                    eps: parseFloat(isNaN(eps) ? 0 : eps),
                    peRatio: parseFloat(isNaN(peRatio) ? 0 : peRatio),
                    trailingPe: parseFloat(isNaN(trailingPe) ? 0 : trailingPe),
                    forwardPe: parseFloat(isNaN(forwardPe) ? 0 : forwardPe),
                    pegRatio: parseFloat(isNaN(pegRatio) ? 0 : pegRatio),
                    priceToBookRatio: parseFloat(isNaN(priceToBookRatio) ? 0 : priceToBookRatio),
                    priceToSalesRatioTtm: parseFloat(isNaN(priceToSalesRatioTtm) ? 0 : priceToSalesRatioTtm),
                    evToEbitda: parseFloat(isNaN(evToEbitda) ? 0 : evToEbitda),
                    revenueTtm: this.formatStatistic(revenue),
                    operatingCashFlow: this.formatStatistic(operatingCashFlow),
                    leveredCashFlow: this.formatStatistic(leveredCashFlow),
                    cash: this.formatStatistic(cash),
                    cashPerShare: this.parseFloat(cashPerShare),
                    currentRatio: this.parseFloat(currentRatio),
                    revenuePerShareTtm: this.parseFloat(revenuePerShareTtm),
                    ebitda: this.formatStatistic(ebitda),
                    profitMargin: this.parsePercentage(profitMargin),
                    quarterlyRevenueGrowthYoy: this.parsePercentage(quarterlyRevenueGrowthYoy),
                    operatingMarginTtm: this.parsePercentage(operatingMargin),
                    stockPrice,
                    stockPriceChange: _.round(((stockPrice - parsedPreviousCloseValue) / stockPrice) * 100, 2),
                    previousCloseValue: parsedPreviousCloseValue,
                    stockPriceDate: new Date()
                }
                this.db.upsertStock(stockPriceData)
        
                // wait random amount of time to make it look less obvious i am a bot
                const waitTime = _.random(500, 5000)
                await wait(waitTime)
            }
            catch(e) {
                console.error('something went wrong:', e)
                await wait(30000)
            }
        }

        await browser.close();

    }

    formatStatistic(statistic) {
        if(!statistic) return 0;
        const unit = statistic.substr(statistic.length - 1, statistic.length);
        const value = this.parseFloat(this.removeUnit(statistic))
        switch(unit) {
            case 'M':
                return value * 1000000
            case 'B':
                return value * 1000000000
            default:
                return 0
        }
    }

    parsePercentage(percentage) {
        const float = parseFloat(percentage)
        return isNaN(float) ? 0 : float
    }

    removeUnit(string = '') {
        return string.substr(0, string.length - 1)
    }

    parseFloat(num) {
        return parseFloat(isNaN(num) ? 0 : num)
    }

}

module.exports = ScrapeYahoo