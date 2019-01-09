const nconf = require("nconf")
const chai = require("chai")
const sinon = require("sinon")
const should = chai.should()
const expect = chai.expect
const uuid = require("uuid")
const rewire = require("rewire")
const { IntentConsumer } = require("../../intent-consumer")

const dispatch = rewire("../../dispatch")

const SAMPLE_CONTEXT = {
    text: "some text",
    channelId: "C1234",
    userId: "U1234"
}

describe("getIntentIdByIntentName", function () {
    const getIntentIdByIntentName = dispatch.__get__("getIntentIdByIntentName")

    it("should return undefined given unknown project", function () {
        const unknownIntentName = "projects/some-unknown-project/agent/intents/" + uuid.v4()

        expect(getIntentIdByIntentName(unknownIntentName)).to.be.undefined
    })

    it("should return intent id given valid ids", function () {
        const expectedIntentId = uuid.v4()
        const intentName = `projects/${nconf.get("DIALOGFLOW_PROJECT_ID")}/agent` +
            `/intents/${expectedIntentId}`

        expect(getIntentIdByIntentName(intentName)).to.equal(expectedIntentId)
    })
})

describe("getIntentConsumerByIntentId", function () {
    const getIntentConsumerByIntentId = dispatch.__get__("getIntentConsumerByIntentId")

    it("should return undefined given undefined name", function () {
        expect(getIntentConsumerByIntentId(undefined)).to.be.undefined
    })

    it("should return undefined given unknown intent id", function () {
        expect(getIntentConsumerByIntentId(uuid.v4())).to.be.undefined
    })

    it("should return correct IntentConsumer provider function", function () {
        const map = dispatch.__get__("INTENT_ID_TO_CONSUMER_PROVIDER_MAP")
        const intentId = nconf.get("INTENT_ID_CHANGE_COLOR")

        expect(map).to.have.property(intentId)

        const providerFn = map[intentId]
        expect(providerFn).to.be.a("function")

        const providerFnSpy = sinon.spy(providerFn)

        // overwrite original fn with spy
        map[intentId] = providerFnSpy

        try {
            const result = getIntentConsumerByIntentId(intentId)
            expect(result).to.be.an.instanceOf(IntentConsumer)
            expect(providerFnSpy).to.have.been.called
        } finally {
            // restore original fn
            map[intentId] = providerFn
        }
    })
})

describe("dispatchIntent", function () {
    const dispatchIntent = dispatch.dispatchIntent
    const getIntentConsumerByIntentId = dispatch.__get__("getIntentConsumerByIntentId")

    it("should throw for missing queryResult", async () => {
        try {
            await dispatchIntent(undefined, SAMPLE_CONTEXT)
        } catch (err) {
            return
        }

        throw new Error("It did not throw")
    })

    it("should throw for missing chatContext", async () => {
        try {
            await dispatchIntent({}, undefined)
        } catch (err) {
            return
        }

        throw new Error("It did not throw")
    })

    it("should throw for unknown intent", async () => {
        const QUERY_RESULT_WITH_UNKNOWN_INTENT_ID = {
            fulfillmentMessages:
                [{
                    platform: "PLATFORM_UNSPECIFIED",
                    text: { text: ["Okay, doing something"] },
                    message: "text",
                }],
            outputContexts: [],
            queryText: "do something",
            speechRecognitionConfidence: 0,
            action: "",
            parameters:
                { fields: { whatToDo: { stringValue: "something", kind: "stringValue" } } },
            allRequiredParamsPresent: true,
            fulfillmentText: "Okay, doing something",
            webhookSource: "",
            webhookPayload: null,
            intent:
                {
                    inputContextNames: [],
                    events: [],
                    trainingPhrases: [],
                    outputContexts: [],
                    parameters: [],
                    messages: [],
                    defaultResponsePlatforms: [],
                    followupIntentInfo: [],
                    name: `projects/${nconf.get("DIALOGFLOW_PROJECT_ID")}/agent/intents/${uuid.v4()}`,
                    displayName: "Do Stuff",
                    priority: 0,
                    isFallback: false,
                    webhookState: "WEBHOOK_STATE_UNSPECIFIED",
                    action: "",
                    resetContexts: false,
                    rootFollowupIntentName: "",
                    parentFollowupIntentName: "",
                    mlDisabled: false,
                },
            intentDetectionConfidence: 1,
            diagnosticInfo: null,
            languageCode: "en-us",
        }

        try {
            await dispatchIntent(QUERY_RESULT_WITH_UNKNOWN_INTENT_ID, SAMPLE_CONTEXT)
        } catch(err) {
            return
        }

        throw new Error("It did not throw")
    })

    it("should call the IntentConsumer's consume method", async ()  => {
        const map = dispatch.__get__("INTENT_ID_TO_CONSUMER_PROVIDER_MAP")
        const intentId = nconf.get("INTENT_ID_CHANGE_COLOR")

        const SAMPLE_QUERY_RESULT = {
            fulfillmentMessages:
                [{
                    platform: "PLATFORM_UNSPECIFIED",
                    text: { text: ["Okay, changing the color to red in a bit"] },
                    message: "text",
                }],
            outputContexts: [],
            queryText: "change color to red",
            speechRecognitionConfidence: 0,
            action: "",
            parameters:
                { fields: { color: { stringValue: "red", kind: "stringValue" } } },
            allRequiredParamsPresent: true,
            fulfillmentText: "Okay, changing the color to red in a bit",
            webhookSource: "",
            webhookPayload: null,
            intent:
                {
                    inputContextNames: [],
                    events: [],
                    trainingPhrases: [],
                    outputContexts: [],
                    parameters: [],
                    messages: [],
                    defaultResponsePlatforms: [],
                    followupIntentInfo: [],
                    name: `projects/${nconf.get("DIALOGFLOW_PROJECT_ID")}/agent/intents/${intentId}`,
                    displayName: "Change Color",
                    priority: 0,
                    isFallback: false,
                    webhookState: "WEBHOOK_STATE_UNSPECIFIED",
                    action: "",
                    resetContexts: false,
                    rootFollowupIntentName: "",
                    parentFollowupIntentName: "",
                    mlDisabled: false,
                },
            intentDetectionConfidence: 1,
            diagnosticInfo: null,
            languageCode: "en-us",
        }

        expect(map).to.have.property(intentId)

        const providerFn = map[intentId]
        expect(providerFn).to.be.a("function")

        const providerFnResult = providerFn()
        map[intentId] = () => providerFnResult // overwrite original fn

        const consumer = getIntentConsumerByIntentId(intentId)
        expect(consumer).to.be.an.instanceOf(IntentConsumer)

        const consumeSpy = sinon.spy(consumer.consume)
        const originalConsume = consumer.consume
        consumer.consume = consumeSpy // overwrite original fn

        try {
            await dispatchIntent(SAMPLE_QUERY_RESULT, SAMPLE_CONTEXT)
            expect(consumeSpy).to.have.been.calledWith(SAMPLE_QUERY_RESULT, SAMPLE_CONTEXT)
        } finally {
            // restore original fns
            consumer.consume = originalConsume
            map[intentId] = providerFn
        }
    })
})
