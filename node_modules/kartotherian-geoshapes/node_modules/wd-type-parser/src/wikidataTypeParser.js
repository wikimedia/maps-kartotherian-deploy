'use strict';
/* global module */

module.exports = parseWikidataValue;

/**
 * Given a value object as returned from Wikidata Query Service, returns a simplified value
 * @param {object} value Original object as sent by the Wikidata query service
 * @param {string} value.type SPARQL data type (literal, uri)
 * @param {string} value.datatype XMLSchema data type
 * @param {*} value.value The actual value sent by the Wikidata query service
 * @param {boolean=} ignoreUnknown if false, will return value.value even if it cannot be recognized
 * @return {*}
 */
function parseWikidataValue(value, ignoreUnknown) {
    var temp;

    if (!value || !value.type || value.value === undefined) {
        return undefined;
    }

    switch (value.type) {
        case 'literal':
            switch (value.datatype) {
                case 'http://www.w3.org/2001/XMLSchema#double':
                case 'http://www.w3.org/2001/XMLSchema#float':
                case 'http://www.w3.org/2001/XMLSchema#decimal':
                case 'http://www.w3.org/2001/XMLSchema#integer':
                case 'http://www.w3.org/2001/XMLSchema#long':
                case 'http://www.w3.org/2001/XMLSchema#int':
                case 'http://www.w3.org/2001/XMLSchema#short':
                case 'http://www.w3.org/2001/XMLSchema#nonNegativeInteger':
                case 'http://www.w3.org/2001/XMLSchema#positiveInteger':
                case 'http://www.w3.org/2001/XMLSchema#unsignedLong':
                case 'http://www.w3.org/2001/XMLSchema#unsignedInt':
                case 'http://www.w3.org/2001/XMLSchema#unsignedShort':
                case 'http://www.w3.org/2001/XMLSchema#nonPositiveInteger':
                case 'http://www.w3.org/2001/XMLSchema#negativeInteger':
                    temp = parseFloat(value.value);
                    if (temp.toString() === value.value) {
                        // use number only if it is fully round-tripable back to string
                        // TBD: this might be overcautios, and would cause more problems than solve
                        return temp;
                    }
                    break;
                case 'http://www.opengis.net/ont/geosparql#wktLiteral':
                    // Point(-64.2 -36.62)  -- (longitude latitude)
                    temp = /^Point\(([-0-9.]+) ([-0-9.]+)\)$/.exec(value.value);
                    if (temp) {
                        return [parseFloat(temp[1]), parseFloat(temp[2])];
                    }
                    break;
            }
            break;
        case 'uri':
            // "http://www.wikidata.org/entity/Q12345"  ->  "Q12345"
            temp = /^http:\/\/www\.wikidata\.org\/entity\/(Q[1-9][0-9]*)$/.exec(value.value);
            if (temp) {
                return temp[1];
            }
            break;
    }
    return ignoreUnknown ? undefined : value.value;
}

