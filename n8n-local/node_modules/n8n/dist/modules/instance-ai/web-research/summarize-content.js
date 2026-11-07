"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maybeSummarize = maybeSummarize;
const SUMMARIZE_THRESHOLD = 15_000;
async function maybeSummarize(page, generateFn) {
    if (page.content.length <= SUMMARIZE_THRESHOLD) {
        return page;
    }
    if (!generateFn) {
        return {
            ...page,
            content: page.content.slice(0, SUMMARIZE_THRESHOLD),
            truncated: true,
        };
    }
    const prompt = `Summarize the following web page content. Preserve:
- API endpoints, URLs, and authentication details
- Code examples and configuration snippets
- Technical specifications and requirements
- Step-by-step instructions

Remove navigation, ads, footers, and repetitive content. Output markdown.

---
${page.content}`;
    const summary = await generateFn(prompt);
    return {
        ...page,
        content: summary,
        contentLength: summary.length,
        truncated: false,
    };
}
//# sourceMappingURL=summarize-content.js.map