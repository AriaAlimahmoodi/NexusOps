"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPreflightModifications = applyPreflightModifications;
function applyPreflightModifications(data, preflightResults) {
    if (preflightResults.length === 0) {
        return data;
    }
    const piiMappings = {};
    for (const result of preflightResults) {
        if (result.info?.maskEntities) {
            const detected = result.info.maskEntities;
            for (const [entityType, entities] of Object.entries(detected)) {
                for (const entity of entities) {
                    piiMappings[entity] = `<${entityType}>`;
                }
            }
        }
    }
    if (Object.keys(piiMappings).length === 0) {
        return data;
    }
    const maskText = (text) => {
        if (typeof text !== 'string') {
            return text;
        }
        let maskedText = text;
        const sortedPii = Object.entries(piiMappings).sort((a, b) => b[0].length - a[0].length);
        for (const [originalPii, maskedToken] of sortedPii) {
            if (maskedText.includes(originalPii)) {
                maskedText = maskedText.split(originalPii).join(maskedToken);
            }
        }
        return maskedText;
    };
    return maskText(data);
}
//# sourceMappingURL=preflight.js.map