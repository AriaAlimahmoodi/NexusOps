"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameProtectedResource = isSameProtectedResource;
async function isSameProtectedResource(registry, requested, granted) {
    if (requested === granted)
        return true;
    const [requestedResource, grantedResource] = await Promise.all([
        registry.getByResourceUrl(requested),
        registry.getByResourceUrl(granted),
    ]);
    return (requestedResource !== undefined &&
        grantedResource !== undefined &&
        requestedResource.id === grantedResource.id);
}
//# sourceMappingURL=resource-identity.js.map