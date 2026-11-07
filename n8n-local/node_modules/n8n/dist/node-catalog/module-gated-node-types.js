"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModuleDisabledNodeTypes = getModuleDisabledNodeTypes;
exports.getModuleDisabledNotice = getModuleDisabledNotice;
const constants_1 = require("@n8n/constants");
function isModuleEnabled(moduleRegistry, moduleName) {
    return moduleRegistry.isActive(moduleName) && !isTurnedOffInSettings(moduleRegistry, moduleName);
}
function isTurnedOffInSettings(moduleRegistry, moduleName) {
    return moduleRegistry.settings.get(moduleName)?.enabled === false;
}
function getModuleDisabledNodeTypes(moduleRegistry) {
    return Object.entries(constants_1.MODULE_GATED_NODE_TYPES)
        .filter(([, moduleName]) => !isModuleEnabled(moduleRegistry, moduleName))
        .map(([nodeType]) => nodeType);
}
function getModuleDisabledNotice(moduleRegistry, nodeType) {
    const moduleName = (0, constants_1.getNodeGatingModule)(nodeType);
    if (!moduleName || isModuleEnabled(moduleRegistry, moduleName))
        return undefined;
    const fix = moduleRegistry.isActive(moduleName)
        ? `An admin turned "${moduleName}" off in the instance settings.`
        : `The "${moduleName}" module is disabled on this instance.`;
    return `This node cannot run, so do not build with it. ${fix}`;
}
//# sourceMappingURL=module-gated-node-types.js.map