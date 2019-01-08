const { IntentConsumer } = require("../intent-consumer")
const { logger } = require("../lib/index")
const _ = require("lodash")
const colorNamer = require("color-namer")
const stringSimilarity = require("string-similarity")
const chroma = require("chroma-js")

const COLOR_SIMILARITY_THRESHOLD = 0.70

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

        // TODO Implement Smart Color Matching

        throw new Error(`Unknown color: '${query}'`)
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
}

module.exports = { CumulusColorChanger }
