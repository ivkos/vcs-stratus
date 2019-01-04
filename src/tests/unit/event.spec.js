const nconf = require('nconf')
const _ = require('lodash')
const AWS = require('aws-sdk')
const AWSMock = require('aws-sdk-mock')
const chai = require('chai')
const request = require('supertest')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect
const moxios = require('moxios')
const url = require('url')
const rewire = require('rewire')

const event = rewire('../../event')

const MESSAGE_IM = {
    client_msg_id: "36110ae8-1390-4be7-a62b-f3ee1e366c9b",
    type: "message",
    text: "bot, what's up",
    user: "ABCDEFGHI",
    ts: "1546451063.000200",
    channel: "DEBB19E1K",
    event_ts: "1546451063.000200",
    channel_type: "im"
}

const MESSAGE_CHANNEL = {
    client_msg_id: "a12adaad-87bf-4c47-b31a-ce9ca3c012c9",
    type: "message",
    text: "bot, go ahead",
    user: "ABCDEFGHI",
    ts: "1546451226.015300",
    channel: "ABCDEFGHI",
    event_ts: "1546451226.015300",
    channel_type: "channel"
}

const MESSAGE_BOT = {
    "type": "message",
    "subtype": "bot_message",
    "ts": "1358877455.000010",
    "text": "Pushing is the answer",
    "bot_id": "BB12033",
    "username": "github",
    "icons": {}
}

const EVENT_EMOJI_CHANGED = {
    "type": "emoji_changed",
    "subtype": "remove",
    "names": ["picard_facepalm"],
    "event_ts" : "1361482916.000004"
}

describe("sendMessage", function () {
    beforeEach(() => moxios.install())
    afterEach(() => moxios.uninstall())

    it("should throw for empty message", async () => {
        const sendMessage = event.__get__("sendMessage")

        try {
            await sendMessage("DEBB19E1K", "")
        } catch (err) {
            return
        }

        throw new Error("Failed")
    })

    it("should throw for empty channel", async () => {
        const sendMessage = event.__get__("sendMessage")

        try {
            await sendMessage("", "some message")
        } catch (err) {
            return
        }

        throw new Error("Failed")
    })

    it("should send the message", async () => {
        let params = null
        moxios.wait(() => {
            let request = moxios.requests.mostRecent()
            params = new url.URLSearchParams(url.parse(request.url).query)
            request.respondWith({
                status: 200,
                response: {
                    ok: true,
                    channel: params.get("channel"),
                    ts: Date.now().toString(),
                    message: {
                        text: params.get("text"),
                        username: "ecto1",
                        bot_id: "B19LU7CSY",
                        attachments: [],
                        type: "message",
                        subtype: "bot_message",
                        ts: Date.now().toString(),
                    },
                },
            })
        })

        const sendMessage = event.__get__("sendMessage")
        await sendMessage(MESSAGE_CHANNEL.channel, MESSAGE_CHANNEL.text)

        params.get("channel").should.equal(MESSAGE_CHANNEL.channel)
        params.get("text").should.equal(MESSAGE_CHANNEL.text)
        params.get("token").should.equal(nconf.get("BOT_USER_TOKEN"))
    })
})

describe("validateMessageType", function () {
    const validateMessageType = event.__get__("validateMessageType")

    it("should throw for bot message", function () {
        expect(() => validateMessageType(MESSAGE_BOT))
            .to.throw()
    })

    it("should throw for non-message", function () {
        expect(() => validateMessageType(EVENT_EMOJI_CHANGED))
            .to.throw()
    })

    it("should accept IM message", function () {
        validateMessageType(MESSAGE_IM)
    })

    it("should accept channel message", function () {
        validateMessageType(MESSAGE_CHANNEL)
    })
})

describe('handler', function () {
    beforeEach(() => moxios.install())
    afterEach(() => moxios.uninstall())

    it('should respond to channel message', async () => {

        let params = null

        moxios.wait(() => {
            let request = moxios.requests.mostRecent()
            params = new url.URLSearchParams(url.parse(request.url).query)
            request.respondWith({
                status: 200,
                response: {
                    ok: true,
                    channel: params.get('channel'),
                    ts: Date.now().toString(),
                    message: {
                        text: params.get('text'),
                        username: 'ecto1',
                        bot_id: 'B19LU7CSY',
                        attachments: [],
                        type: 'message',
                        subtype: 'bot_message',
                        ts: Date.now().toString()
                    }
                }
            })
        })

        await event.handler({ Records: [{ body: JSON.stringify(MESSAGE_CHANNEL) }] })
        params.get('channel').should.equal(MESSAGE_CHANNEL.channel)
        params.get('token').should.equal(nconf.get('BOT_USER_TOKEN'))

    })

    it('should respond to direct message', async () => {

        let params = null

        moxios.wait(() => {
            let request = moxios.requests.mostRecent()
            params = new url.URLSearchParams(url.parse(request.url).query)
            request.respondWith({
                status: 200,
                response: {
                    ok: true,
                    channel: params.get('channel'),
                    ts: Date.now().toString(),
                    message: {
                        text: params.get('text'),
                        username: 'ecto1',
                        bot_id: 'B19LU7CSY',
                        attachments: [],
                        type: 'message',
                        subtype: 'bot_message',
                        ts: Date.now().toString()
                    }
                }
            })
        })

        await event.handler({ Records: [{ body: JSON.stringify(MESSAGE_IM) }] })
        params.get('channel').should.equal(MESSAGE_IM.channel)
        params.get('token').should.equal(nconf.get('BOT_USER_TOKEN'))

    })

})
