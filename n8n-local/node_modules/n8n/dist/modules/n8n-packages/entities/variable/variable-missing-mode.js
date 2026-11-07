"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variableMissingModeCreates = variableMissingModeCreates;
exports.variableMissingModeUsesPackageValue = variableMissingModeUsesPackageValue;
exports.variableBlockingFailures = variableBlockingFailures;
const n8n_packages_types_1 = require("../../n8n-packages.types");
const ON_MISSING_VARIABLE = {
    [n8n_packages_types_1.VariableMissingMode.DoNothing]: { creates: false, usesPackageValue: false, blocks: false },
    [n8n_packages_types_1.VariableMissingMode.MustPreexist]: { creates: false, usesPackageValue: false, blocks: true },
    [n8n_packages_types_1.VariableMissingMode.CreateStub]: { creates: true, usesPackageValue: false, blocks: false },
    [n8n_packages_types_1.VariableMissingMode.CreateWithValue]: { creates: true, usesPackageValue: true, blocks: false },
};
function variableMissingModeCreates(mode) {
    return ON_MISSING_VARIABLE[mode].creates;
}
function variableMissingModeUsesPackageValue(mode) {
    return ON_MISSING_VARIABLE[mode].usesPackageValue;
}
function variableBlockingFailures(mode, plan) {
    return ON_MISSING_VARIABLE[mode].blocks ? plan.missing : [];
}
//# sourceMappingURL=variable-missing-mode.js.map