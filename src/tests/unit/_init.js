// configuration
const nconf = require('nconf')
nconf.env().defaults({
    EVENT_QUEUE: 'dummy-queue',
    BOT_USER_TOKEN: 'xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT',
    SLACK_SIGNING_SECRET: '12345678901234567890123456789012',
})

const chai = require('chai')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

const { logger, } = require('../../lib')

before(() => {
    logger.transports[0].silent = true
})

after(() => {
    logger.transports[0].silent = false
})
