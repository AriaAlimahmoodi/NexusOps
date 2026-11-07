"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiTransformToCode = void 0;
exports.aiTransformToCode = {
    ruleId: 'ai-transform-deprecated',
    migrate: (node) => {
        const jsCode = node.parameters.jsCode;
        if (!jsCode) {
            throw new Error('This AI Transform node has no generated code yet. Open it and click "Generate code" (or replace it with a Code node manually) before migrating.');
        }
        return {
            node: {
                type: 'n8n-nodes-base.code',
                typeVersion: 2,
                parameters: {
                    mode: 'runOnceForAllItems',
                    language: 'javaScript',
                    jsCode,
                },
            },
        };
    },
};
//# sourceMappingURL=ai-transform-to-code.migration.js.map