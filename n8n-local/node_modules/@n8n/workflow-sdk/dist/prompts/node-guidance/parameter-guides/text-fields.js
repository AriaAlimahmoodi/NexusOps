"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEXT_FIELDS_GUIDE = void 0;
function hasTextFields(nodeDefinition) {
    if (!nodeDefinition.properties)
        return false;
    return nodeDefinition.properties.some((prop) => prop.type === 'string' && prop.typeOptions?.multipleValues !== true);
}
exports.TEXT_FIELDS_GUIDE = {
    patterns: ['*'],
    condition: (ctx) => hasTextFields(ctx.nodeDefinition),
    content: `
## Text Field Expression Formatting

### PREFERRED METHOD: Embedding expressions directly within text
\`\`\`
"text": "=ALERT: It is currently {{ $('Weather Node').item.json.weather }} in {{ $('Weather Node').item.json.city }}!"
\`\`\`

### Alternative method: Using string concatenation (use only when needed)
\`\`\`
"text": "={{ 'ALERT: It is currently ' + $('Weather Node').item.json.weather + ' in ' + $('Weather Node').item.json.city + '!' }}"
\`\`\`

### Key Points:
- Use the embedded expression format when mixing static text with dynamic values
- The entire string must start with = when using expressions
- Expressions within text use single curly braces {{ }}
- The outer expression wrapper uses double curly braces ={{ }}`,
};
//# sourceMappingURL=text-fields.js.map