const chai = require("chai")
const expect = chai.expect
const sinon = require("sinon")

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

describe("makeRequestFromUrl", function () {
    it("should throw when url is missing", function () {
        expect(() => colorChanger.makeRequestFromUrl(undefined)).to.throw()
    })

    it("should return response with url", function () {
        const expectedUrl = "http://example.com/image.jpg"

        expect(colorChanger.makeRequestFromUrl(expectedUrl))
            .to
            .deep
            .equal({
                image: { source: { imageUri: expectedUrl } },
                features: [{
                    type: 7,
                }],
            })
    })
})

describe("getDominantColorOfResponse", function () {
    it("should return undefined for no input", function () {
        expect(colorChanger.getDominantColorOfResponse(undefined))
            .to.be.undefined
    })

    it("should return the most dominant color", function () {
        const SAMPLE_RESPONSE = {
            "faceAnnotations": [],
            "landmarkAnnotations": [],
            "logoAnnotations": [],
            "labelAnnotations": [],
            "textAnnotations": [],
            "localizedObjectAnnotations": [],
            "safeSearchAnnotation": null,
            "imagePropertiesAnnotation": {
                "dominantColors": {
                    "colors": [{
                        "color": {
                            "red": 225,
                            "green": 180,
                            "blue": 28,
                            "alpha": null,
                        }, "score": 0.5705379247665405, "pixelFraction": 0.17102880775928497,
                    }, {
                        "color": { "red": 228, "green": 201, "blue": 135, "alpha": null },
                        "score": 0.10004014521837234,
                        "pixelFraction": 0.07769547402858734,
                    }, {
                        "color": { "red": 163, "green": 96, "blue": 21, "alpha": null },
                        "score": 0.004735912196338177,
                        "pixelFraction": 0.002633744850754738,
                    }, {
                        "color": { "red": 232, "green": 188, "blue": 18, "alpha": null },
                        "score": 0.10188251733779907,
                        "pixelFraction": 0.029574759304523468,
                    }, {
                        "color": { "red": 225, "green": 197, "blue": 107, "alpha": null },
                        "score": 0.05823405832052231,
                        "pixelFraction": 0.05558298900723457,
                    }, {
                        "color": { "red": 225, "green": 168, "blue": 6, "alpha": null },
                        "score": 0.033435069024562836,
                        "pixelFraction": 0.003950617276132107,
                    }, {
                        "color": { "red": 251, "green": 223, "blue": 125, "alpha": null },
                        "score": 0.03314116969704628,
                        "pixelFraction": 0.04559670761227608,
                    }, {
                        "color": { "red": 214, "green": 155, "blue": 6, "alpha": null },
                        "score": 0.022064389660954475,
                        "pixelFraction": 0.00565157737582922,
                    }, {
                        "color": { "red": 247, "green": 227, "blue": 161, "alpha": null },
                        "score": 0.017387835308909416,
                        "pixelFraction": 0.03423868492245674,
                    }, {
                        "color": { "red": 215, "green": 165, "blue": 15, "alpha": null },
                        "score": 0.015696551650762558,
                        "pixelFraction": 0.005596708040684462,
                    }],
                },
            },
            "error": null,
            "cropHintsAnnotation": {
                "cropHints": [{
                    "boundingPoly": {
                        "vertices": [{ "x": 0, "y": 0 }, {
                            "x": 599,
                            "y": 0,
                        }, { "x": 599, "y": 599 }, { "x": 0, "y": 599 }], "normalizedVertices": [],
                    }, "confidence": 0.7999999523162842, "importanceFraction": 1,
                }],
            },
            "fullTextAnnotation": null,
            "webDetection": null,
            "productSearchResults": null,
            "context": null,
        }

        expect(colorChanger.getDominantColorOfResponse(SAMPLE_RESPONSE))
            .to.equal("#e1b41c")
    })

    it("should return zeroes for missing color components", function () {
        const SAMPLE_RESPONSE = {
            "faceAnnotations": [],
            "landmarkAnnotations": [],
            "logoAnnotations": [],
            "labelAnnotations": [],
            "textAnnotations": [],
            "localizedObjectAnnotations": [],
            "safeSearchAnnotation": null,
            "imagePropertiesAnnotation": {
                "dominantColors": {
                    "colors": [{
                        "color": {
                            "alpha": null,
                        }, "score": 0.5705379247665405, "pixelFraction": 0.17102880775928497,
                    }],
                },
            },
            "error": null,
            "cropHintsAnnotation": {
                "cropHints": [{
                    "boundingPoly": {
                        "vertices": [{ "x": 0, "y": 0 }, {
                            "x": 599,
                            "y": 0,
                        }, { "x": 599, "y": 599 }, { "x": 0, "y": 599 }], "normalizedVertices": [],
                    }, "confidence": 0.7999999523162842, "importanceFraction": 1,
                }],
            },
            "fullTextAnnotation": null,
            "webDetection": null,
            "productSearchResults": null,
            "context": null,
        }

        expect(colorChanger.getDominantColorOfResponse(SAMPLE_RESPONSE))
            .to.equal("#000000")
    })
})

const SAMPLE_IMAGES_RESPONSE = [{
    "type": "image/jpeg",
    "width": 600,
    "height": 600,
    "size": 123263,
    "url": "https://cdn3.volusion.com/kceqm.mleru/v/vspfiles/photos/74-2.jpg?1521734349",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT60ggbWUDeFbaNMF-v9a4kQ47ERwlvCvQ3gC5KOoG5hcP5atIiYFCKTRr6",
        "width": 135,
        "height": 135,
    },
    "description": "Seedless Lemons",
    "parentPage": "https://www.melissas.com/Seedless-Lemons-p/74.htm",
}, {
    "type": "image/jpeg",
    "width": 780,
    "height": 520,
    "size": 60418,
    "url": "https://compote.slate.com/images/e9a9228b-4897-4566-a9e9-42ea25633d9a.jpeg?width=780&height=520&rect=507x338&offset=0x0",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6K8Uai4ZLzd6D-2YsDkY4lXM1crbe1IEKijkSUl2z0J6UiIMHMiLgclVz",
        "width": 142,
        "height": 95,
    },
    "description": "2 million people watched a video of a lemon rolling down a hill ...",
    "parentPage": "https://slate.com/technology/2018/07/2-million-people-watched-a-video-of-a-lemon-rolling-down-a-hill-because-nihilism-rules-the-internet.html",
}, {
    "type": "image/jpeg",
    "width": 600,
    "height": 600,
    "size": 36116,
    "url": "https://citinewsroom.com/wp-content/uploads/2018/11/Lemon.jpg",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMZq29SfzFHnPgY5q4JN_0XUL34YznHHnM7VWKih6h6bJBankAY3JwFHPW",
        "width": 135,
        "height": 135,
    },
    "description": "Top 20 benefits of lemon juice for health and beauty",
    "parentPage": "https://citinewsroom.com/2018/11/05/top-20-benefits-of-lemon-juice-for-health-and-beauty/",
}, {
    "type": "image/jpeg",
    "width": 480,
    "height": 383,
    "size": 23026,
    "url": "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/766/images/lemon-uses-0-1494115921.jpg?resize=480:*",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmrSoJlCpE__sZyGntze3bcrwY5t8B_5sh8b77Tyi-xtMl8TxJSpsT-Eg",
        "width": 129,
        "height": 103,
    },
    "description": "11 Beauty Uses for Lemons",
    "parentPage": "https://www.womenshealthmag.com/beauty/a19934865/uses-for-lemons/",
}, {
    "type": "image/jpeg",
    "width": 700,
    "height": 525,
    "size": 96846,
    "url": "http://beautytipsblog.org/wp-content/uploads/2018/11/lemon.jpg",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAfhnpqoSOUNqPdjqPiMfI96XVgu2Up4i9RdvRFlnNG_JKM56Z0a0EBXE",
        "width": 140,
        "height": 105,
    },
    "description": "lemon - Beauty Tips Blog",
    "parentPage": "http://beautytipsblog.org/here-are-some-natural-tips-and-tricks-to-achieving-a-healthier-glow/lemon/",
}, {
    "type": "image/jpeg",
    "width": 1702,
    "height": 1127,
    "size": 220955,
    "url": "https://i2.wp.com/www.healthfitnessrevolution.com/wp-content/uploads/2016/10/iStock_68714965_MEDIUM.jpg?fit=1702%2C1127",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5KRxm2clDDHAFpc1UjaYvwg_u25T78mOan2naTPKMlgfm4PBsHvCu7Ru7",
        "width": 150,
        "height": 99,
    },
    "description": "Top 10 Health Benefits of Lemons and Limes • Health Fitness Revolution",
    "parentPage": "http://www.healthfitnessrevolution.com/top-10-health-benefits-of-lemons-and-limes/",
}, {
    "type": "image/jpeg",
    "width": 1000,
    "height": 667,
    "size": 501808,
    "url": "https://static1.squarespace.com/static/5899e78b1b10e35238fba886/t/5b6488cc575d1fad33074aec/1533315278883/shutterstock_657752761.jpg",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSYWKzX9iiN1de2hPQFSkGcAthvXYKIkNba0ht5lJPC46woT3pNCDU-oM",
        "width": 149,
        "height": 99,
    },
    "description": "An \"act of God\" puts the squeeze on lemons — FreightWaves",
    "parentPage": "https://www.freightwaves.com/news/lemons-getting-the-squeeze",
}, {
    "type": "image/jpeg",
    "width": 725,
    "height": 482,
    "size": 56042,
    "url": "https://i.ndtvimg.com/mt/cooks/2014-11/lemon.jpg",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHuG6vIZBX2Y71oVXk3nB5jtn2lWunUF8bfo3VlKbpFrRUv-bqupXfcm10",
        "width": 140,
        "height": 93,
    },
    "description": "Lemon - Art Works ADV",
    "parentPage": "https://www.artworksadv.com/lemon/",
}, {
    "type": "image/jpeg",
    "width": 780,
    "height": 439,
    "size": 333714,
    "url": "http://www.unclematts.com/wp-content/uploads/2016/10/lemons.jpg",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0soNzYjidS4pYW3PhIIOq4XK6z1A0NxD8YtflyD-AwY_cf2mxHJL0yfkc",
        "width": 142,
        "height": 80,
    },
    "description": "Organic Lemon Water with Peel… Your Morning Ritual's New Best ...",
    "parentPage": "http://www.unclematts.com/organic-lemon-water-with-peel-your-morning-rituals-new-best-friend/",
}, {
    "type": "image/gif",
    "width": 1100,
    "height": 732,
    "size": 82706,
    "url": "https://cdn1.medicalnewstoday.com/content/images/articles/283/283476/lemons.gif",
    "thumbnail": {
        "url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTF45O3Oj0-nS2UV57IhgZeaw73snfXMzHcAPTtFvBafFpTUZl3IbOF72k",
        "width": 150,
        "height": 100,
    },
    "description": "Lemons: Benefits, nutrition, tips, and risks",
    "parentPage": "https://www.medicalnewstoday.com/articles/283476.php",
}]

describe("searchGoogleImages", function () {
    it("should return empty array given no query", async () => {
        expect(await colorChanger.searchGoogleImages(undefined))
            .to.be.an("array")
            .and.be.empty
    })

    it("should return non-empty results", async () => {
        const stub = sinon.stub(colorChanger, "searchGoogleImages")
            .callsFake(async () => SAMPLE_IMAGES_RESPONSE)

        const result = await colorChanger.searchGoogleImages("lemon")
        expect(result)
            .to.be.an("array")
            .and.not.be.empty

        stub.restore()
    })
})

describe("getTopImageUrls", function () {
    it("should return empty array given no query", async () => {
        expect(await colorChanger.getTopImageUrls(undefined))
            .to.be.an("array")
            .and.be.empty
    })

    it("should return non-empty results", async () => {
        const stub = sinon.stub(colorChanger, "searchGoogleImages")
            .callsFake(async () => SAMPLE_IMAGES_RESPONSE)

        const result = await colorChanger.getTopImageUrls("lemon")
        expect(result)
            .to.be.an("array")
            .and.not.be.empty

        stub.restore()
    })

    it("should not include non-JPG and non-PNG results", async () => {
        const stub = sinon.stub(colorChanger, "searchGoogleImages")
            .callsFake(async () => SAMPLE_IMAGES_RESPONSE)

        const originalImages = await colorChanger.searchGoogleImages("lemon")
        const nonJpegOrPngImage = originalImages.find(i => i.type !== "image/jpeg" && i.type !== "image/png")
        const nonJpegOrPngImageUrl = nonJpegOrPngImage.url

        const result = await colorChanger.getTopImageUrls("lemon")
        expect(result).to.not.include(nonJpegOrPngImageUrl)

        stub.restore()
    })
})
