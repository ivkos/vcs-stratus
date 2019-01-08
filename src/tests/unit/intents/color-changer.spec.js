const chai = require("chai")
const expect = chai.expect

const { CumulusColorChanger } = require("../../../intents/color-changer")

const colorChanger = new CumulusColorChanger()

describe("findColorByName", function () {
    it("should return undefined for empty query", function () {
        expect(colorChanger.findColorByName(undefined))
            .to.be.undefined
    })

    it("should return undefined for no match", function () {
        expect(colorChanger.findColorByName("gibberish non-existent color"))
            .to.be.undefined
    })

    it("should return color for exact match", function () {
        expect(colorChanger.findColorByName("red"))
            .to.be.ok
            .and
            .to.have.property("hex", "ff0000")
    })

    it("should return color for close match", function () {
        expect(colorChanger.findColorByName("rose gold"))
            .to.be.ok
            .and
            .to.have.property("hex", "c08081")
    })
})

describe("findColor", function () {
    it("should throw for empty query", async () => {
        try {
            await colorChanger.findColor(undefined)
        } catch(err) {
            return
        }

        throw new Error("It did not throw")
    })

    it("should return color for exact match", async () => {
        expect(await colorChanger.findColor("red"))
            .to.equal("#ff0000")
    })

    it("should return color for close match", async () => {
        expect(await colorChanger.findColor("rose gold"))
            .to.equal("#c08081")
    })

    // TODO This test will become obsolete after implementing Smart Color Matching
    it("should throw for unknown color", async () => {
        try {
            await colorChanger.findColor("gibberish non-existent color")
        } catch (err) {
            return
        }

        throw new Error("It did not throw")
    })
})
