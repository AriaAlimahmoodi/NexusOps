"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSharedFields = extractSharedFields;
exports.getChangedSharedFields = getChangedSharedFields;
const di_1 = require("@n8n/di");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_workflow_1 = require("n8n-workflow");
const credential_types_1 = require("../../../credential-types");
function getExtendedProps(type, credentialTypes) {
    const props = [];
    for (const parentTypeName of type.extends ?? []) {
        const parentType = credentialTypes.getByName(parentTypeName);
        const parentProps = getExtendedProps(parentType, credentialTypes);
        n8n_workflow_1.NodeHelpers.mergeNodeProperties(props, parentProps);
    }
    n8n_workflow_1.NodeHelpers.mergeNodeProperties(props, type.properties);
    return props;
}
function extractSharedFields(credentialType) {
    const credentialTypes = di_1.Container.get(credential_types_1.CredentialTypes);
    const mergedProperties = getExtendedProps(credentialType, credentialTypes);
    const sharedFields = [];
    for (const property of mergedProperties) {
        if (property.resolvableField !== true) {
            sharedFields.push(property.name);
        }
    }
    return sharedFields;
}
function getChangedSharedFields(credentialType, oldData, newData) {
    const sharedFields = extractSharedFields(credentialType);
    return sharedFields.filter((field) => {
        if (!(field in newData))
            return false;
        if (newData[field] === n8n_workflow_1.CREDENTIAL_BLANKING_VALUE)
            return false;
        return !(0, isEqual_1.default)(oldData[field], newData[field]);
    });
}
//# sourceMappingURL=shared-fields.js.map