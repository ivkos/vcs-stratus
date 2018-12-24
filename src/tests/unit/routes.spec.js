const _ = require('lodash')
const chai = require('chai')
const request = require('supertest')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect
const moxios = require('moxios')

const { expressApp, } = require('./_utils')
const routes = require('../../routes.js')

describe('Tests routes', function () {

    const app = expressApp([routes])
    beforeEach(() => moxios.install())
    afterEach(() => moxios.uninstall())

    it('GET /', async () => {

        const res = await request(app)
        .get('/')

        res.status.should.equal(200)
    })

})
