"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDK_IMPORT_STATEMENT = void 0;
exports.stripImportStatements = stripImportStatements;
exports.extractWorkflowCode = extractWorkflowCode;
exports.SDK_IMPORT_STATEMENT = "import { workflow, node, trigger, sticky, placeholder, newCredential, ifElse, switchCase, merge, splitInBatches, nextBatch, languageModel, memory, tool, outputParser, embedding, embeddings, vectorStore, retriever, documentLoader, textSplitter, reranker, fromAi, expr } from '@n8n/workflow-sdk';";
function stripImportStatements(code) {
    const importRegex = /^\s*import\s+(?:[\s\S]*?from\s+)?['"][^'"]+['"];?\s*$/gm;
    return code
        .replace(importRegex, '')
        .replace(/^\s*\n/, '')
        .trim();
}
function extractWorkflowCode(response) {
    const codeBlockRegex = /```(?:typescript|ts|javascript|js)?\n([\s\S]*?)```/;
    const match = response.match(codeBlockRegex);
    if (match) {
        const code = match[1].trim();
        return stripImportStatements(code);
    }
    return stripImportStatements(response.trim());
}
//# sourceMappingURL=extract-code.js.map