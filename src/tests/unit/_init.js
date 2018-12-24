// configuration
const nconf = require('nconf')
nconf.env().defaults({
    
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
