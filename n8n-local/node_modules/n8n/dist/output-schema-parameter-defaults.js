"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParameterDefaults = getParameterDefaults;
function isShownFor(property, context) {
    const show = property.displayOptions?.show;
    if (!show)
        return true;
    return ['resource', 'operation'].every((key) => {
        const shownValues = show[key];
        const value = context[key];
        return !Array.isArray(shownValues) || value === undefined || shownValues.includes(value);
    });
}
function getParameterDefaults(properties, context) {
    const defaults = new Map();
    for (const property of properties ?? []) {
        if (defaults.has(property.name) || !isShownFor(property, context))
            continue;
        defaults.set(property.name, property.default);
    }
    return Object.fromEntries(defaults);
}
//# sourceMappingURL=output-schema-parameter-defaults.js.map