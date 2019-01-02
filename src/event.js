const nconf = require('nconf')
nconf.env()

const axios = require('axios')
const { logger, } = require('./lib')
const SLACK_URL = 'https://slack.com/api/chat.postMessage'

async function handleEvent(e) {

    try {

        logger.info('Slack event: ' + e)
        const body = JSON.parse(e)

        if ('message' !== body.event.type) {
            throw new Error(`I don't support this event type: ${body.event.type}`)
        }

        if ('bot_message' === body.event.subtype) {
             throw new Error(`We don't serve your kind here!`)
        }

        // user - the ID of the user who sent the message
        // channel - the ID of the channel where the message was posted
        // text - the text of the message
        const { user, text, channel } = body.event

        // TODO: handle the event here based on text
        logger.info('User ID: ' + user)
        logger.info('Channel ID: ' + channel)
        logger.info('Text: ' + text)

        // ignore messages not starting with 'bot'
        if (!text.startsWith('bot')) {
            throw new Error('This does not concern me')
        }

        // return message to Slack
        const responseText = `The answer to your query (${text}) is 42`
        const uri = SLACK_URL + `?channel=${channel}&token=${nconf.get('BOT_USER_TOKEN')}&text=${encodeURIComponent(responseText)}`
        const response = await axios.post(uri)

        logger.info('Slack response: ' + JSON.stringify(response.data))

    } catch (err) {
        logger.warn(err.message)
    }

}

exports.handler = async function (event, context) {
    for (let i = 0; i < event.Records.length; i++) {
        await handleEvent(event.Records[i].body)
    }
}
