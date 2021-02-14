class Utils {
    constructor() {}

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

module.exports = new Utils()