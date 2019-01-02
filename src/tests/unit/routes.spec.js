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

    it('POST / url_verification', async () => {

        const res = await request(app)
        .post('/')
        .send({
            token: 'some-token',
            challenge: 'some-challenge',
            type: 'url_verification'
        })

        res.status.should.equal(200)
        res.text.should.equal('some-challenge')

    })

    it('POST / unknown', async () => {

        const res = await request(app)
        .post('/')
        .send({ type: 'unknown' })

        res.status.should.equal(400)
        res.body.status.should.equal('error')

    })

    it('POST / event_callback', async () => {

        moxios.stubRequest(/\/api\/chat.postMessage/, {
            status: 200,
            response: {
                ok: true,
                channel: 'C1H9RESGL',
                ts: '1503435956.000247',
                message: {
                    text: "Here's a message for you",
                    username: 'ecto1',
                    bot_id: 'B19LU7CSY',
                    attachments: [{
                        text: 'This is an attachment',
                        id: 1,
                        fallback: "This is an attachment's fallback"
                    }],
                    type: 'message',
                    subtype: 'bot_message',
                    ts: '1503435956.000247'
                }
            }
        })

        const res = await request(app)
        .post('/')
        .send({
            token: 'same-token',
            team_id: '123456789',
            api_app_id: 'ABCDEFGHI',
            event: {
                client_msg_id: '5e33bc80-0839-421e-9ff9-3426a7beac63',
                type: 'message',
                text: 'bot, go ahead',
                user: 'A1B2C3D4E',
                ts: '1546432717.003800',
                channel: 'ZXYGKKGVK',
                event_ts: '1546432717.003800',
                channel_type: 'channel'
            },
            type: 'event_callback',
            event_id: 'EvF510L537',
            event_time: 1546432717,
            authed_users: [
                'A1B2C3D4E'
            ]
        })

        res.status.should.equal(200)
        res.body.status.should.equal('ok')

    })

})
