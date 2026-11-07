"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasResourceLocatorParameters = hasResourceLocatorParameters;
function hasResourceLocatorParameters(nodeDefinition) {
    if (!nodeDefinition.properties)
        return false;
    const checkProperties = (properties) => {
        for (const prop of properties) {
            if (prop.type === 'resourceLocator' || prop.type === 'fixedCollection')
                return true;
        }
        return false;
    };
    return checkProperties(nodeDefinition.properties);
}
//# sourceMappingURL=utils.js.map