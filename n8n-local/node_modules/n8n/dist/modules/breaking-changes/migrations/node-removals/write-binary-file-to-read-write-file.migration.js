"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeBinaryFileToReadWriteFile = void 0;
const parameter_readers_1 = require("../parameter-readers");
exports.writeBinaryFileToReadWriteFile = {
    ruleId: 'write-binary-file-removed-v3',
    migrate: (node) => {
        const options = (0, parameter_readers_1.asParameters)(node.parameters.options);
        if (node.parameters.options !== undefined && !options) {
            throw new Error('The options of this node are not in a supported format.');
        }
        if ((0, parameter_readers_1.isExpression)(options?.append)) {
            throw new Error('"Append" is an expression. The old node reads it once and the new node reads it for each item, so the node cannot be migrated automatically.');
        }
        return {
            node: {
                type: 'n8n-nodes-base.readWriteFile',
                typeVersion: 1.1,
                parameters: {
                    operation: 'write',
                    ...(0, parameter_readers_1.pickDefined)(node.parameters, ['fileName', 'dataPropertyName', 'options']),
                },
            },
        };
    },
};
//# sourceMappingURL=write-binary-file-to-read-write-file.migration.js.map