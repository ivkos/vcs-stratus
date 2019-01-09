class IntentConsumer {
    /**
     * @param {QueryResult} queryResult
     * @param {{userId: string, channelId: string, text: string}} chatContext
     * @param {function(message:string): Promise<*>} respond
     * @return {Promise<*>}
     * @abstract
     */
    async consume(queryResult, chatContext, respond) {
        throw new Error("IntentConsumer::consume(...) is not implemented")
    }
}

module.exports = { IntentConsumer }
