const _ = require('lodash')
const AWS = require('aws-sdk')
const AWSMock = require('aws-sdk-mock')
const chai = require('chai')
const request = require('supertest')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect
const moxios = require('moxios')

const { expressApp, } = require('./_utils')
const routes = require('../../routes')

describe('routes.js', function () {

    beforeEach(() => moxios.install())
    afterEach(() => moxios.uninstall())

})
