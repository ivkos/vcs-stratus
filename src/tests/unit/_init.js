// configuration
const nconf = require('nconf')
nconf.env().defaults({
    EVENT_QUEUE: 'dummy-queue',
    BOT_USER_TOKEN: 'xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT',
    SLACK_SIGNING_SECRET: '12345678901234567890123456789012',
    DIALOGFLOW_PROJECT_ID: "stratus-1337af",
    INTENT_ID_CHANGE_COLOR: "f8008532-a18c-451d-94b9-c584ff2e6076",
    BROKER_URI: "broker.example.com",
    CUMULUS_COMMAND_TOPIC: "bec539fe59154f84852777049bb0abd8/stratus/message"
})

const chai = require('chai')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(sinonChai)
chai.use(chaiAsPromised)

const { logger, } = require('../../lib')

before(() => {
    logger.transports[0].silent = true
})

after(() => {
    logger.transports[0].silent = false
})
