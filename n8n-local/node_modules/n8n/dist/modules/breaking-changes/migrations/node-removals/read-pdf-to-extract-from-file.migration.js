"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPdfToExtractFromFile = void 0;
const parameter_readers_1 = require("../parameter-readers");
exports.readPdfToExtractFromFile = {
    ruleId: 'read-pdf-removed-v3',
    migrate: (node) => {
        const { encrypted, password } = node.parameters;
        if ((0, parameter_readers_1.isExpression)(encrypted)) {
            throw new Error('"Encrypted" is an expression, so the node cannot be migrated automatically.');
        }
        return {
            node: {
                type: 'n8n-nodes-base.extractFromFile',
                typeVersion: 1.2,
                parameters: {
                    operation: 'pdf',
                    ...(0, parameter_readers_1.pickDefined)(node.parameters, ['binaryPropertyName']),
                    options: {
                        keepSource: 'binary',
                        ...(encrypted === true ? { password: password ?? '' } : {}),
                    },
                },
            },
        };
    },
};
//# sourceMappingURL=read-pdf-to-extract-from-file.migration.js.map