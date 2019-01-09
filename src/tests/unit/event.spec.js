const chai = require('chai')
const sinon = require('sinon')
const should = chai.should()
const expect = chai.expect
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

describe("checkAddresseeAndGetMessage", function () {
    const checkAddresseeAndGetMessage = event.__get__("checkAddresseeAndGetMessage")

    it("should throw for empty message", function () {
        expect(() => checkAddresseeAndGetMessage(""))
            .to.throw()
    })

    it("should throw for message not directed to bot", function () {
        expect(() => checkAddresseeAndGetMessage("Guys check this out: https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
            .to.throw()
    })

    it("should throw for message beginning with the prefix with no boundary", function () {
        expect(() => checkAddresseeAndGetMessage("Botswana is the best country"))
            .to.throw()
    })

    context("when message is directed at bot", () => {
        it("should accept lower case prefix", () => {
            expect(checkAddresseeAndGetMessage("bot hello")).to.equal("hello")
        })

        it("should accept upper case prefix", function () {
            expect(checkAddresseeAndGetMessage("Bot how are you")).to.equal("how are you")
        })

        it("should accept prefix when delimited by comma", function () {
            expect(checkAddresseeAndGetMessage("Bot, how you doin?")).to.equal("how you doin?")
        })

        it("should accept prefix regardless of case", function () {
            expect(checkAddresseeAndGetMessage("bOt cHanGe tHe CoLoR to ReD")).to.equal("cHanGe tHe CoLoR to ReD")
        })

        it("should return trimmed message", function () {
            expect(checkAddresseeAndGetMessage("bot   hello ")).to.equal("hello")
        })

        it("should return the prefix if message after it is empty", function () {
            expect(checkAddresseeAndGetMessage("Bot?")).to.equal("Bot?")
            expect(checkAddresseeAndGetMessage("Bot")).to.equal("Bot")
            expect(checkAddresseeAndGetMessage("Bot ")).to.equal("Bot")
            expect(checkAddresseeAndGetMessage(" Bot ")).to.equal("Bot")
            expect(checkAddresseeAndGetMessage(" Bot? ")).to.equal("Bot?")
            expect(checkAddresseeAndGetMessage("bot!!!")).to.equal("bot!!!")
        })
    })
})

