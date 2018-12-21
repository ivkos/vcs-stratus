const nconf = require('nconf')
nconf.env()

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')

const routes = require('./routes')

// create app
const app = express()

// setup middleware
app.use(cors())
app.use(morgan('combined'))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false }))

// route all requests to routes
routes(app)

// catch 404 and forward it to error handler
app.use((req, res, next) => {
    let err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handler
app.use(function(err, req, res, next) {
    logger.error(err.message)
    res.status(err.status || 500).json({message: err.message})
})

module.exports = app
