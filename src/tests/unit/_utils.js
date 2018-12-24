const nconf = require('nconf')
const express = require('express')
const bodyParser = require('body-parser')

function expressApp(routers) {
    const app = express()

    app.use(bodyParser.json({ limit: '50mb' }))
    app.use(bodyParser.urlencoded({ extended: false }))

    // bind routers
    routers.forEach(r => r(app))

    return app
}

module.exports = {
    expressApp,
}
