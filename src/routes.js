const express = require('express')
const nconf = require('nconf')
const { logger, } = require('./lib')


module.exports = function(sqs, app) {

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
                    await publishToQueue(nconf.get('EVENT_QUEUE'), req.body)
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
            logger.error(err.message)
            res.status(500).json({
                status: 'error',
                errorCode: 'GENERAL_ERROR',
                errorMessage: err.message
            })
        }

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
