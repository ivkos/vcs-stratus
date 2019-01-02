const express = require('express')
const axios = require('axios')
const nconf = require('nconf')
const { logger, } = require('./lib')

const SLACK_URL = 'https://slack.com/api/chat.postMessage'

module.exports = function(app) {

    const router = express.Router()
    app.use('/', router)

    router.get('/', async (req, res, next) => {
        res.json({ status: 'ok'})
    })

    router.post('/', async (req, res, next) => {
        try {

            switch (req.body.type) {

                // verification URL is used to ensure the endpoint is valid
                // and trusted by Slack
                case 'url_verification':
                    res.send(req.body.challenge)
                    // TODO: save the token
                    break

                // typical event callback
                // always respond with 200 in order to
                // please Slack with "swift response"
                case 'event_callback':
                    // TODO: validate the token
                    // TODO: instead of handling the event directly, publish it to SQS
                    await handleEvent(req)
                    res.json({ status: 'ok' })
                    break

                // well, we are rate limited.
                // c'est la vie :(
                case 'app_rate_limited':
                    // TODO: validate the token
                    res.json({ status: 'ok' })
                    break

                // by default respond with 400
                // for invalid event types
                default:
                    res.status(400).json({
                        status: 'error',
                        errorCode: 'INVALID_EVENT_TYPE',
                        errorMessage: 'Invalid event type'
                    })
            }

        } catch (err) {
            res.status(500).json({
                status: 'error',
                errorCode: 'GENERAL_ERROR',
                errorMessage: err.message
            })
        }

    })

    async function handleEvent(req) {
        try {
            logger.info(JSON.stringify(req.body))

            if ('message' !== req.body.event.type) {
                throw new Error(`I don't support this event type: ${req.body.event.type}`)
            }

            if ('bot_message' === req.body.event.subtype) {
                 throw new Error(`We don't serve your kind here!`)
            }

            // user - the ID of the user who sent the message
            // channel - the ID of the channel where the message was posted
            // text - the text of the message
            const { user, text, channel } = req.body.event

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

        } catch (err) {
            logger.warn(err.message)
        }

    }

}
