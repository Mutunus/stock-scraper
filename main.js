const Yahoo = require('./find_winners')
const db = require('./db')
const Tasks = require('./tasks/tasks')

class Main {
    constructor() {
        this.yahooScraper = new Yahoo(db)
        this.tasks = new Tasks(db)
    }

    init() {
        this.yahooScraper.init()
        this.tasks.init()
    }

}

module.exports = Main