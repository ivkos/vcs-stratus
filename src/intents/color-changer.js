const { IntentConsumer } = require("../intent-consumer")
const { logger } = require("../lib/index")
const _ = require("lodash")

class CumulusColorChanger extends IntentConsumer {
    async consume(queryResult) {
        if (!queryResult.allRequiredParamsPresent) {
            throw new Error("Not all required params are present")
        }

        const desiredColor = _.get(
            queryResult,
            "parameters.fields.color.stringValue",
        )

        if (!desiredColor) {
            throw new Error("Color is missing")
        }

        logger.info(`Changing color to '${queryResult.parameters.fields}'`)

        // TODO Call Open IoT to change Cumulus color
    }
}

module.exports = { CumulusColorChanger }
