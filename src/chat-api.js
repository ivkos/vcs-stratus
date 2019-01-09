const axios = require("axios")
const { logger } = require("./lib")
const nconf = require("nconf")

const SLACK_URL = "https://slack.com/api/chat.postMessage"

/**
 * @param {string} channel
 * @param {string} message
 * @return {Promise<void>}
 */
async function sendMessage(channel, message) {
    if (!channel) throw new Error("channel must not be empty")
    if (!message) throw new Error("message must not be empty")

    const uri = SLACK_URL + `?channel=${channel}&token=${nconf.get("BOT_USER_TOKEN")}&text=${encodeURIComponent(message)}`
    const response = await axios.post(uri)
    logger.info("Slack response: " + JSON.stringify(response.data))
}

/**
 * @param {string} channel
 * @return {function(message: string): Promise<void>}
 */
function createRespondFunction(channel) {
    if (!channel) throw new Error("channel is missing")
    return async message => sendMessage(channel, message)
}

module.exports = {
    sendMessage,
    createRespondFunction
}
