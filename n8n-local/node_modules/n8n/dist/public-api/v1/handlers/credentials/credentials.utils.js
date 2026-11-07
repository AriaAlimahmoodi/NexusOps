"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSharedForCredential = buildSharedForCredential;
exports.validateCredentialData = validateCredentialData;
exports.assertValidUpdateProperties = assertValidUpdateProperties;
exports.toJsonSchema = toJsonSchema;
const jsonschema_1 = require("jsonschema");
const errors_1 = require("@n8n/errors");
function isNodePropertyOptions(options) {
    return (Array.isArray(options) &&
        options.every((item) => typeof item === 'object' && item !== null && 'value' in item && 'name' in item));
}
function buildSharedForCredential(credential) {
    const shared = credential.shared;
    return shared
        .filter((sh) => typeof sh.project?.id === 'string')
        .map((sh) => ({
        id: sh.project.id,
        name: sh.project.name,
        role: sh.role,
        createdAt: sh.createdAt,
        updatedAt: sh.updatedAt,
    }));
}
function validateCredentialData(credentialsHelper, credentialType, data, options) {
    const properties = credentialsHelper
        .getCredentialsProperties(credentialType)
        .filter((property) => property.type !== 'hidden');
    const schema = toJsonSchema(properties);
    if (options?.partialData) {
        schema.required = [];
        delete schema.allOf;
    }
    const { valid, errors } = (0, jsonschema_1.validate)(data, schema, { nestedErrors: true });
    if (!valid) {
        throw new errors_1.BadRequestError(errors.map((error) => `request.body.data ${error.message}`).join(','));
    }
}
function assertValidUpdateProperties(credentialsHelper, existingCredential, body) {
    if (body.data !== undefined) {
        const effectiveType = body.type ?? existingCredential.type;
        validateCredentialData(credentialsHelper, effectiveType, body.data, {
            partialData: body.isPartialData === true,
        });
    }
    else if (body.type !== undefined && body.type !== existingCredential.type) {
        throw new errors_1.BadRequestError('req.body.data is required when changing credential type. The existing data cannot ' +
            'be used with the new type.');
    }
}
function isRequired(property) {
    if (!property.required)
        return false;
    return property.default === undefined || property.default === null || property.default === '';
}
function toJsonSchema(properties) {
    const jsonSchema = {
        additionalProperties: false,
        type: 'object',
        properties: {},
        allOf: [],
        required: [],
    };
    const optionsValues = {};
    const resolveProperties = [];
    properties
        .filter((property) => property.type === 'options')
        .forEach((property) => {
        Object.assign(optionsValues, {
            [property.name]: isNodePropertyOptions(property.options)
                ? property.options.map((option) => option.value)
                : undefined,
        });
    });
    let requiredFields = [];
    const propertyRequiredDependencies = {};
    properties.forEach((property) => {
        if (isRequired(property)) {
            requiredFields.push(property.name);
        }
        if (property.type === 'options') {
            Object.assign(jsonSchema.properties, {
                [property.name]: {
                    type: 'string',
                    enum: isNodePropertyOptions(property.options)
                        ? property.options.map((data) => data.value)
                        : undefined,
                },
            });
        }
        else {
            Object.assign(jsonSchema.properties, {
                [property.name]: {
                    type: property.type,
                },
            });
        }
        if (property.displayOptions?.show) {
            const dependantName = Object.keys(property.displayOptions?.show)[0] || '';
            const displayOptionsValues = property.displayOptions.show[dependantName];
            let dependantValue = '';
            if (displayOptionsValues &&
                Array.isArray(displayOptionsValues) &&
                displayOptionsValues[0] !== undefined &&
                displayOptionsValues[0] !== null) {
                dependantValue = displayOptionsValues[0];
            }
            const dependencyKey = `${dependantName}:${JSON.stringify(dependantValue)}`;
            if (!resolveProperties.includes(dependencyKey)) {
                let conditionalValue;
                if (typeof dependantValue === 'object' && dependantValue._cnd) {
                    const [key, targetValue] = Object.entries(dependantValue._cnd)[0];
                    if (key === 'eq') {
                        conditionalValue = {
                            const: [targetValue],
                        };
                    }
                    else if (key === 'not') {
                        conditionalValue = {
                            not: {
                                const: [targetValue],
                            },
                        };
                    }
                    else if (key === 'gt') {
                        conditionalValue = {
                            type: 'number',
                            exclusiveMinimum: [targetValue],
                        };
                    }
                    else if (key === 'gte') {
                        conditionalValue = {
                            type: 'number',
                            minimum: [targetValue],
                        };
                    }
                    else if (key === 'lt') {
                        conditionalValue = {
                            type: 'number',
                            exclusiveMaximum: [targetValue],
                        };
                    }
                    else if (key === 'lte') {
                        conditionalValue = {
                            type: 'number',
                            maximum: [targetValue],
                        };
                    }
                    else if (key === 'startsWith') {
                        conditionalValue = {
                            type: 'string',
                            pattern: `^${targetValue}`,
                        };
                    }
                    else if (key === 'endsWith') {
                        conditionalValue = {
                            type: 'string',
                            pattern: `${targetValue}$`,
                        };
                    }
                    else if (key === 'includes') {
                        conditionalValue = {
                            type: 'string',
                            pattern: `${targetValue}`,
                        };
                    }
                    else if (key === 'regex') {
                        conditionalValue = {
                            type: 'string',
                            pattern: `${targetValue}`,
                        };
                    }
                    else {
                        conditionalValue = {
                            enum: [dependantValue],
                        };
                    }
                }
                else {
                    conditionalValue = {
                        enum: [dependantValue],
                    };
                }
                propertyRequiredDependencies[dependencyKey] = {
                    if: {
                        properties: {
                            [dependantName]: conditionalValue,
                        },
                        required: [dependantName],
                    },
                    then: {
                        allOf: [],
                    },
                };
                resolveProperties.push(dependencyKey);
            }
            if (isRequired(property)) {
                propertyRequiredDependencies[dependencyKey].then?.allOf.push({
                    required: [property.name],
                });
            }
            requiredFields = requiredFields.filter((field) => field !== property.name);
        }
    });
    Object.assign(jsonSchema, { required: requiredFields });
    jsonSchema.allOf = Object.values(propertyRequiredDependencies).filter((dependency) => (dependency.then?.allOf.length ?? 0) > 0);
    if (!jsonSchema.allOf.length) {
        delete jsonSchema.allOf;
    }
    return jsonSchema;
}
//# sourceMappingURL=credentials.utils.js.map