"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFullDescription = isFullDescription;
exports.copyCredentialSupport = copyCredentialSupport;
exports.setToolCodex = setToolCodex;
function isFullDescription(obj) {
    return typeof obj === 'object' && obj !== null && 'properties' in obj;
}
function copyCredentialSupport(known, originalNodeName, newNodeName) {
    const credentialNames = Object.entries(known.credentials)
        .filter(([_, credential]) => credential?.supportedNodes?.includes(originalNodeName))
        .map(([credentialName]) => credentialName);
    credentialNames.forEach((name) => {
        known.credentials[name]?.supportedNodes?.push(newNodeName);
    });
}
function setToolCodex(description, toolSubcategory, preserveExisting = false) {
    const resources = description.codex?.resources ?? {};
    const existingToolsSubcategory = description.codex?.subcategories?.Tools;
    const alias = description.codex?.alias;
    description.codex = {
        categories: ['AI'],
        subcategories: {
            AI: ['Tools'],
            Tools: preserveExisting && existingToolsSubcategory ? existingToolsSubcategory : [toolSubcategory],
        },
        resources,
        ...(alias && { alias }),
    };
}
//# sourceMappingURL=utils.js.map