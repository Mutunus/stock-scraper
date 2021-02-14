const DeleteOldDocs = require('./delete-old-docs')

class Tasks {
    constructor(db) {
        this.deleteOldDocs = new DeleteOldDocs(db)
        this.init(db)
    }

    init(db) {
        this.deleteOldDocs.init()
    }

}

module.exports = Tasks;