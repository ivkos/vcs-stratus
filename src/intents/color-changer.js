const { IntentConsumer } = require("../intent-consumer")
const { logger } = require("../lib/index")
const _ = require("lodash")
const colorNamer = require("color-namer")
const stringSimilarity = require("string-similarity")
const chroma = require("chroma-js")
const GoogleImages = require("google-images")
const vision = require("@google-cloud/vision")
const path = require("path")
const nconf = require("nconf")

const COLOR_SIMILARITY_THRESHOLD = 0.70
const MAX_IMAGE_COUNT = 20

class CumulusColorChanger extends IntentConsumer {
    async consume(queryResult) {
        if (!queryResult.allRequiredParamsPresent) {
            throw new Error("Not all required params are present")
        }

        const desiredColor = _.get(
            queryResult,
            "parameters.fields.color.stringValue",
        )

        const matchedColor = await this.findColor(desiredColor)
        logger.info(`Changing color to ${matchedColor}`)

        // TODO Call Open IoT to change Cumulus color
    }

    /**
     * @param {string} query
     * @return {Promise<string>}
     */
    async findColor(query) {
        if (!query) throw new Error("Color is missing")

        const foundColorByName = this.findColorByName(query)
        if (foundColorByName) {
            return `#${foundColorByName.hex}`
        }

        try {
            return chroma(query).hex()
        } catch(err) {
            // ignore
        }

        return this.smartMatchColor(query)
    }

    /**
     * @param {string} query
     * @returns {{name:string, hex: string, collection: string, normalizedName: string, similarity: number}|undefined}
     */
    findColorByName(query) {
        if (!query) return undefined

        return _(colorNamer.lists)
            .toPairs()
            .flatMap(([collection, colors]) => _.map(colors, color => ({ ...color, collection })))
            .map(color => ({ ...color, normalizedName: color.name.toLowerCase() }))
            .map(color => ({ ...color, similarity: stringSimilarity.compareTwoStrings(query, color.normalizedName) }))
            .filter(color => color.similarity >= COLOR_SIMILARITY_THRESHOLD)
            .map(color => ({ ...color, hex: color.hex.replace(/^#/, "").toLowerCase() }))
            .sortBy("similarity")
            .reverse()
            .head()
    }

    /**
     * @param {string} query
     * @return {Promise<string>}
     */
    async smartMatchColor(query) {
        const urls = await this.getTopImageUrls(query)

        const result = await this.createVisionClient().batchAnnotateImages({
            requests: urls.map(this.makeRequestFromUrl),
        })

        const responses = _.get(result, "[0].responses")
        if (!responses) throw new Error("There are no responses")
        this.logErrorResponses(responses, urls)

        const successfulResponses = responses.filter(r => !r.error)
        if (successfulResponses.length === 0) {
            throw new Error("There are no successful responses from Vision API")
        }

        return chroma
            .average(successfulResponses.map(this.getDominantColorOfResponse))
            .hex()
    }

    /**
     * @param {{}[]} responses
     * @param {string[]} urls
     * @private
     */
    logErrorResponses(responses, urls) {
        responses
            .filter(r => !!r.error)
            .forEach((r, i) => {
                logger.warn(
                    `Vision API response for URL '${urls[i]}' failed`,
                    r.error,
                )
            })
    }

    /**
     * @return {vision.ImageAnnotatorClient}
     * @private
     */
    createVisionClient() {
        return new vision.ImageAnnotatorClient({
            keyFilename: path.join(
                __dirname,
                "..",
                "secrets",
                nconf.get("GOOGLE_APPLICATION_CREDENTIALS_FILENAME"),
            ),
        })
    }

    /**
     * @param {string} query
     * @return {Promise<string[]>}
     * @private
     */
    async getTopImageUrls(query) {
        if (!query) return []

        const images = await this.searchGoogleImages(query)

        const topImages = images
            .filter(i => i.type === "image/jpeg" || i.type === "image/png")
            .slice(0, MAX_IMAGE_COUNT)

        return topImages.map(i => i.url)
    }

    /**
     * @param query
     * @return {Promise<GoogleImages.Image[]>}
     * @private
     */
    async searchGoogleImages(query) {
        if (!query) return []

        const client = new GoogleImages(
            nconf.get("GOOGLE_CSE_ID"),
            nconf.get("GOOGLE_CSE_API_KEY"),
        )

        return client.search(query)
    }

    /**
     * @param {AnnotateImageResponse} response
     * @return {string|undefined}
     */
    getDominantColorOfResponse(response) {
        const colors = _.get(response, "imagePropertiesAnnotation.dominantColors.colors")
        if (!colors) return undefined
        if (!colors[0]) return undefined
        if (!colors[0].color) return undefined

        const c = colors[0].color

        return chroma(
            c.red || 0,
            c.green || 0,
            c.blue || 0,
        ).hex()
    }

    /**
     * @param {string} url
     * @return {{image: {source: {imageUri: *}}, features: {type: number}[]}}
     * @private
     */
    makeRequestFromUrl(url) {
        if (!url) throw new Error("url is missing")

        return {
            image: { source: { imageUri: url } },
            features: [{
                type: 7, // IMAGE_PROPERTIES
            }],
        }
    }
}

module.exports = { CumulusColorChanger }
