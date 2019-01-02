const express = require('express')
const nconf = require('nconf')
const { createEventAdapter } = require('@slack/events-api');
const { logger, } = require('./lib')

module.exports = function(sqs, app) {

    const slackEvents = createEventAdapter(nconf.get('SLACK_SIGNING_SECRET'), { waitForResponse: true })

    const router = express.Router()
    app.use('/', router)

    router.post('/slack/events', slackEvents.expressMiddleware())

    slackEvents.on('message', async (event, respond) => {
        try {
            logger.info(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
            await publishToQueue(nconf.get('EVENT_QUEUE'), event)
            respond(null)
        } catch (err) {
            respond(err)
        }
    })

    slackEvents.on('error', (err, respond) => {
        logger.error(err)
        respond(err)
    })

    function publishToQueue(queueName, message) {
        return new Promise((fulfill, reject) => {

            logger.info(`Publishing message to queue ${queueName}`)

            const params = {
                MessageBody: JSON.stringify(message),
                QueueUrl: queueName
            }

            sqs.sendMessage(params, (err, data) => {
                if (err) reject(err)
                else fulfill(data)
            })

        })
    }

}
