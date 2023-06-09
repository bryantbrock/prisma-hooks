// https://stackoverflow.com/questions/26540706/preserving-undefined-that-json-stringify-otherwise-removes
export function serializePrismaQuery(value, undefinedPlaceholder = "[undefined]") {
    return JSON.stringify(value, (_key, value) => value === undefined ? undefinedPlaceholder : value);
}
export function deserializePrismaQuery(value, undefinedPlaceholder = "[undefined]") {
    let result = JSON.parse(value);
    // Function to recursively replace `undefined` placeholders
    function replaceUndefinedPlaceholder(value) {
        if (typeof value === "object" && value !== null) {
            for (const key in value) {
                if (value[key] === undefinedPlaceholder) {
                    value[key] = undefined;
                }
                else {
                    replaceUndefinedPlaceholder(value[key]);
                }
            }
        }
        else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (item === undefinedPlaceholder) {
                    value[index] = undefined;
                }
                else {
                    replaceUndefinedPlaceholder(item);
                }
            });
        }
    }
    replaceUndefinedPlaceholder(result);
    return result;
}
//# sourceMappingURL=utils.js.map