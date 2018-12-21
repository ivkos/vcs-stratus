const express = require('express')

module.exports = function(app) {

    const router = express.Router()
    app.use('/', router)

    router.get('/', async (req, res, next) => {
        res.json({ status: 'ok'})
    })

}
