class IntentConsumer {
    /**
     * @param {QueryResult} queryResult
     * @return {Promise<*>}
     * @abstract
     */
    async consume(queryResult) {
        throw new Error("IntentConsumer::consume(...) is not implemented")
    }
}

module.exports = { IntentConsumer }
