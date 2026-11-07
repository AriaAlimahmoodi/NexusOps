"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlExtractToHtml = void 0;
const parameter_readers_1 = require("../parameter-readers");
const EMPTY_TEXT_NOTE = 'A value that returns "Text" now has no value, not an empty text, when its selector finds nothing or the element has no text. Check the nodes that read these values.';
function mayReturnText(extractionValues) {
    const values = (0, parameter_readers_1.asParameters)(extractionValues)?.values;
    if (!Array.isArray(values))
        return false;
    return values.some((value) => {
        const { returnValue = 'text' } = (0, parameter_readers_1.asParameters)(value) ?? {};
        return returnValue === 'text' || (0, parameter_readers_1.isExpression)(returnValue);
    });
}
exports.htmlExtractToHtml = {
    ruleId: 'html-extract-removed-v3',
    migrate: (node) => {
        const options = node.parameters.options === undefined ? {} : (0, parameter_readers_1.asParameters)(node.parameters.options);
        if (!options) {
            throw new Error('The options of this node are not in a supported format.');
        }
        if ((0, parameter_readers_1.isExpression)(options.trimValues)) {
            throw new Error('"Trim Values" is an expression, so the node cannot be migrated automatically.');
        }
        return {
            node: {
                type: 'n8n-nodes-base.html',
                typeVersion: 1.1,
                parameters: {
                    operation: 'extractHtmlContent',
                    ...(0, parameter_readers_1.pickDefined)(node.parameters, ['sourceData', 'dataPropertyName']),
                    extractionValues: node.parameters.extractionValues ?? {},
                    options: { trimValues: options.trimValues ?? true, cleanUpText: false },
                },
            },
            notes: mayReturnText(node.parameters.extractionValues) ? [EMPTY_TEXT_NOTE] : undefined,
        };
    },
};
//# sourceMappingURL=html-extract-to-html.migration.js.map