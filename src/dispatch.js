const nconf = require("nconf")
const { logger } = require("./lib")
const { createRespondFunction } = require("./chat-api")

const INTENT_ID_TO_CONSUMER_PROVIDER_MAP = {
    [nconf.get("INTENT_ID_CHANGE_COLOR")]: () => {
        const { CumulusColorChanger } = require("./intents/color-changer")
        return new CumulusColorChanger()
    },
}


/**
 * @param {QueryResult} queryResult
 * @param {{userId: string, channelId: string, text: string}} chatContext
 * @returns {Promise<void>}
 */
async function dispatchIntent(queryResult, chatContext) {
    if (!queryResult) throw new Error("Missing queryResult")
    if (!chatContext) throw new Error("Missing chatContext")

    const intentDisplayName = queryResult.intent.displayName
    const intentId = getIntentIdByIntentName(queryResult.intent.name)

    const consumer = getIntentConsumerByIntentId(intentId)
    if (!consumer) {
        throw new Error(`Unknown intent: '${intentDisplayName}' (${intentId})`)
    }

    const consumerName = consumer.constructor.name
    logger.info(`Dispatching to ${consumerName} intent '${intentDisplayName}' (${intentId})`)

    try {
        return consumer.consume(
            queryResult,
            chatContext,
            createRespondFunction(chatContext.channelId),
        )
    } catch (err) {
        logger.error(`Error occurred in intent consumer ${consumerName}`, err)
    }
}

/**
 * @param {string} intentId
 * @returns {IntentConsumer|undefined}
 */
function getIntentConsumerByIntentId(intentId) {
    const providerFn = INTENT_ID_TO_CONSUMER_PROVIDER_MAP[intentId]
    if (!providerFn) return undefined

    return providerFn()
}

/**
 * @param {string} intentName
 * @returns {string|undefined}
 */
function getIntentIdByIntentName(intentName) {
    if (!intentName) return undefined

    const regex = new RegExp(
        `^projects/${nconf.get("DIALOGFLOW_PROJECT_ID")}` +
        `/agent/intents/(.+)$`,
    )

    const matches = intentName.match(regex)
    if (matches === null) return undefined

    return matches[1]
}

module.exports = {
    dispatchIntent,
}
