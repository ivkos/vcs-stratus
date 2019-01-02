const nconf = require('nconf')
nconf.env()

const express = require('express')
const morgan = require('morgan')
const AWS = require('aws-sdk')
const Promise = require('bluebird')

const { logger, } = require('./lib')
const routes = require('./routes')

// configure AWS
AWS.Promise = Promise
const sqs = new AWS.SQS()

// create app
const app = express()

// setup middleware
app.use(morgan('combined', { 'stream': logger.stream }))

// route all requests to routes
routes(sqs, app)

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
