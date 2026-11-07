"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOnceForAllItems = runOnceForAllItems;
exports.runOnceForEachItem = runOnceForEachItem;
function extractFunctionBody(fn) {
    const fnStr = fn.toString();
    const arrowMatch = fnStr.match(/^\s*\(?(\w+)\)?\s*=>\s*(.+)$/s);
    if (arrowMatch) {
        const paramName = arrowMatch[1];
        let body = arrowMatch[2].trim();
        if (body.startsWith('{') && body.endsWith('}')) {
            body = body.slice(1, -1).trim();
        }
        else {
            body = `return ${body};`;
        }
        body = body.replace(new RegExp(`${paramName}\\.\\$`, 'g'), '$');
        body = body.replace(new RegExp(`${paramName}\\(`, 'g'), '$(');
        body = body.replace(new RegExp(`${paramName}\\.`, 'g'), '');
        return body;
    }
    const funcMatch = fnStr.match(/function\s*\(\s*(\w+)\s*\)\s*\{([\s\S]*)\}$/);
    if (funcMatch) {
        const paramName = funcMatch[1];
        let body = funcMatch[2].trim();
        body = body.replace(new RegExp(`${paramName}\\.\\$`, 'g'), '$');
        body = body.replace(new RegExp(`${paramName}\\(`, 'g'), '$(');
        body = body.replace(new RegExp(`${paramName}\\.`, 'g'), '');
        return body;
    }
    throw new Error('Unable to parse function body');
}
function runOnceForAllItems(fn) {
    const jsCode = extractFunctionBody(fn);
    return {
        mode: 'runOnceForAllItems',
        jsCode,
    };
}
function runOnceForEachItem(fn) {
    const jsCode = extractFunctionBody(fn);
    return {
        mode: 'runOnceForEachItem',
        jsCode,
    };
}
//# sourceMappingURL=code-helpers.js.map