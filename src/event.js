const nconf = require('nconf')
nconf.env()

const axios = require('axios')
const { logger, } = require('./lib')
const SLACK_URL = 'https://slack.com/api/chat.postMessage'

const dialogflow = require('dialogflow')
const uuid = require('uuid')
const path = require('path')

const MESSAGE_PREFIX = "bot"
const MESSAGE_PREFIX_REGEX = new RegExp("^" + MESSAGE_PREFIX + "(?:[\\s,.?!;-]+(.*))?$", "i")

async function handleEvent(e) {

    try {

        logger.info('Slack event: ' + e)
        const body = JSON.parse(e)

        validateMessageType(body)

        // user - the ID of the user who sent the message
        // channel - the ID of the channel where the message was posted
        // text - the text of the message
        const { user, text, channel } = body

        // TODO: handle the event here based on text
        logger.info('User ID: ' + user)
        logger.info('Channel ID: ' + channel)
        logger.info('Text: ' + text)

        const message = checkAddresseeAndGetMessage(text)

        const sessionClient = new dialogflow.SessionsClient({
            keyFilename: path.join(__dirname, 'secrets', nconf.get('GOOGLE_APPLICATION_CREDENTIALS_FILENAME'))
        })

        const sessionPath = sessionClient.sessionPath(nconf.get('DIALOGFLOW_PROJECT_ID'), uuid.v4())
        const dialogflowRequest = {
            session: sessionPath,
            queryInput: {
                text: { text: message, languageCode: 'en-US' },
            },
        }

        const responses = await sessionClient.detectIntent(dialogflowRequest)
        const result = responses[0].queryResult
        const fulfillmentText = result.fulfillmentText

        if (result.intent) {
            logger.info(`Matched intent: ${result.intent.displayName}`)

            if (fulfillmentText) {
                await sendMessage(channel, fulfillmentText)
            }
        } else {
            logger.warn("Did not match any intent")	
            if (fulfillmentText) {
                await sendMessage(channel, fulfillmentText)
            } else {
                await sendMessage(channel, "I don't know what you mean")
            }
        }

    } catch (err) {
        logger.warn(err.message)
    }

}

async function sendMessage(channel, message) {
    if (!channel) throw new Error("channel must not be empty")
    if (!message) throw new Error("message must not be empty")

    const uri = SLACK_URL + `?channel=${channel}&token=${nconf.get('BOT_USER_TOKEN')}&text=${encodeURIComponent(message)}`
    const response = await axios.post(uri)
    logger.info('Slack response: ' + JSON.stringify(response.data))
}

function validateMessageType(message) {
    if ('message' !== message.type) {
        throw new Error(`I don't support this event type: ${message.type}`)
    }

    if ('bot_message' === message.subtype) {
        throw new Error(`We don't serve your kind here!`)
    }
}

/**
 * @param {string} text
 * @return {string} the message without the prefix
 */
function checkAddresseeAndGetMessage(text) {
    if (!text) throw new Error("text must not be empty")

    const trimmedText = text.trim()

    const matches = trimmedText.match(MESSAGE_PREFIX_REGEX)
    if (matches === null) {
        throw new Error("This does not concern me")
    }

    const message = matches[1] ? matches[1].trim() : ""
    if (!message) return matches[0]

    return message.trim()
}

exports.handler = async function (event, context) {
    for (let i = 0; i < event.Records.length; i++) {
        await handleEvent(event.Records[i].body)
    }
}
