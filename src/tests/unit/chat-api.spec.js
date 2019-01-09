const nconf = require("nconf")
const chai = require("chai")
const sinon = require("sinon")
const should = chai.should()
const expect = chai.expect
const moxios = require("moxios")
const url = require("url")

const { sendMessage, createRespondFunction } = require("../../chat-api")

const MESSAGE_CHANNEL = {
    client_msg_id: "a12adaad-87bf-4c47-b31a-ce9ca3c012c9",
    type: "message",
    text: "bot, go ahead",
    user: "ABCDEFGHI",
    ts: "1546451226.015300",
    channel: "ABCDEFGHI",
    event_ts: "1546451226.015300",
    channel_type: "channel",
}

describe("sendMessage", function () {
    beforeEach(() => moxios.install())
    afterEach(() => moxios.uninstall())

    it("should throw for empty message", async () => {
        try {
            await sendMessage("DEBB19E1K", "")
        } catch (err) {
            return
        }

        throw new Error("It did not throw")
    })

    it("should throw for empty channel", async () => {
        try {
            await sendMessage("", "some message")
        } catch (err) {
            return
        }

        throw new Error("It did not throw")
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

        await sendMessage(MESSAGE_CHANNEL.channel, MESSAGE_CHANNEL.text)

        params.get("channel").should.equal(MESSAGE_CHANNEL.channel)
        params.get("text").should.equal(MESSAGE_CHANNEL.text)
        params.get("token").should.equal(nconf.get("BOT_USER_TOKEN"))
    })
})

describe("createRespondFunction", function () {
    beforeEach(() => moxios.install())
    afterEach(() => moxios.uninstall())

    it("should throw for missing channel", function () {
        expect(() => createRespondFunction(undefined))
            .to.throw
    })

    it("should return function", function () {
        expect(createRespondFunction("C1234"))
            .to.be.a("function")
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

        const respond = createRespondFunction(MESSAGE_CHANNEL.channel)
        await respond(MESSAGE_CHANNEL.text)

        params.get("channel").should.equal(MESSAGE_CHANNEL.channel)
        params.get("text").should.equal(MESSAGE_CHANNEL.text)
        params.get("token").should.equal(nconf.get("BOT_USER_TOKEN"))
    })
})
