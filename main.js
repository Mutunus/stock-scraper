const Yahoo = require('./find_winners')
const db = require('./db')
const Tasks = require('./tasks/tasks')

class Main {
    constructor() {
        this.yahooScraper = new Yahoo(db)
        this.tasks = new Tasks(db)
    }

    init() {
        console.log('LEO EATS DICKS')
        this.yahooScraper.init()
        this.tasks.init()
    }

}

module.exports = Main