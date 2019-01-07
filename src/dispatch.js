const nconf = require("nconf")
const { logger } = require("./lib")


const INTENT_ID_TO_CONSUMER_PROVIDER_MAP = {
    [nconf.get("INTENT_ID_CHANGE_COLOR")]: () => {
        const { CumulusColorChanger } = require("./intents/color-changer")
        return new CumulusColorChanger()
    },
}


/**
 * @param {QueryResult} queryResult
 * @returns {Promise<void>}
 */
async function dispatchIntent(queryResult) {
    if (!queryResult) throw new Error("Missing queryResult")

    const intentDisplayName = queryResult.intent.displayName
    const intentId = getIntentIdByIntentName(queryResult.intent.name)

    const consumer = getIntentConsumerByIntentId(intentId)
    if (!consumer) {
        throw new Error(`Unknown intent: '${intentDisplayName}' (${intentId})`)
    }

    const consumerName = consumer.constructor.name
    logger.info(`Dispatching to ${consumerName} intent '${intentDisplayName}' (${intentId})`)

    try {
        return consumer.consume(queryResult)
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
