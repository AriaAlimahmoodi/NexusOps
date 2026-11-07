"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndExtract = fetchAndExtract;
let _linkedom;
let _readability;
let _turndown;
let _turndownGfm;
function loadLinkedom() {
    if (!_linkedom) {
        _linkedom = require('linkedom');
    }
    return _linkedom.parseHTML;
}
function loadReadability() {
    if (!_readability) {
        _readability = require('@mozilla/readability');
    }
    return _readability.Readability;
}
function loadTurndown() {
    if (!_turndown) {
        _turndown = require('turndown');
    }
    return _turndown;
}
function loadTurndownGfm() {
    if (!_turndownGfm) {
        _turndownGfm = require('@joplin/turndown-plugin-gfm');
    }
    return _turndownGfm.gfm;
}
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 120_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_CONTENT_LENGTH = 30_000;
function unwrapFetchError(error) {
    let current = error;
    const seen = new Set();
    while (current instanceof Error && current.cause instanceof Error && !seen.has(current)) {
        seen.add(current);
        current = current.cause;
    }
    return current;
}
async function fetchAndExtract(url, options) {
    const maxContentLength = options.maxContentLength ?? DEFAULT_MAX_CONTENT_LENGTH;
    const maxResponseBytes = options.maxResponseBytes ?? MAX_RESPONSE_BYTES;
    const timeoutMs = Math.min(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);
    const customFetch = options.transport.asCustomFetch();
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = options.abortSignal
        ? AbortSignal.any([timeoutSignal, options.abortSignal])
        : timeoutSignal;
    let response;
    try {
        response = await customFetch(url, {
            signal,
            headers: {
                'User-Agent': 'n8n-instance-ai/1.0 (content extraction)',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,application/pdf;q=0.7,*/*;q=0.5',
            },
            redirect: 'follow',
        });
    }
    catch (error) {
        throw unwrapFetchError(error);
    }
    const finalUrl = response.url || url;
    if (!response.ok) {
        await response.body?.cancel().catch(() => { });
        return {
            url,
            finalUrl,
            title: '',
            content: `HTTP ${response.status}: ${response.statusText}`,
            truncated: false,
            contentLength: 0,
        };
    }
    const rawBody = await readLimitedBody(response, maxResponseBytes);
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/pdf')) {
        return await extractPdf(url, finalUrl, rawBody, maxContentLength);
    }
    if (contentType.includes('text/plain') || contentType.includes('text/markdown')) {
        return extractPlainText(url, finalUrl, rawBody, maxContentLength);
    }
    return extractHtml(url, finalUrl, rawBody, maxContentLength);
}
async function readLimitedBody(response, maxBytes) {
    const chunks = [];
    let totalBytes = 0;
    if (!response.body) {
        return Buffer.alloc(0);
    }
    const reader = response.body.getReader();
    let truncated = false;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const chunk = Buffer.from(value);
            totalBytes += chunk.length;
            if (totalBytes > maxBytes) {
                chunks.push(chunk.subarray(0, maxBytes - (totalBytes - chunk.length)));
                truncated = true;
                break;
            }
            chunks.push(chunk);
        }
    }
    finally {
        if (truncated) {
            await reader.cancel().catch(() => { });
        }
        reader.releaseLock();
    }
    return Buffer.concat(chunks);
}
function extractHtml(url, finalUrl, body, maxContentLength) {
    const html = body.toString('utf-8');
    const { document } = loadLinkedom()(html);
    const safetyFlags = detectSafetyFlags(html);
    const Readability = loadReadability();
    const reader = new Readability(document);
    const article = reader.parse();
    if (!article) {
        const fallbackText = document.body?.textContent ?? '';
        const truncated = fallbackText.length > maxContentLength;
        const content = truncated ? fallbackText.slice(0, maxContentLength) : fallbackText;
        return {
            url,
            finalUrl,
            title: document.title ?? '',
            content,
            truncated,
            contentLength: fallbackText.length,
            ...(hasSafetyFlags(safetyFlags) ? { safetyFlags } : {}),
        };
    }
    const turndown = createTurndownService();
    let markdown = turndown.turndown(article.content ?? '');
    const truncated = markdown.length > maxContentLength;
    const contentLength = markdown.length;
    if (truncated) {
        markdown = markdown.slice(0, maxContentLength);
    }
    return {
        url,
        finalUrl,
        title: article.title ?? '',
        content: markdown,
        truncated,
        contentLength,
        ...(hasSafetyFlags(safetyFlags) ? { safetyFlags } : {}),
    };
}
async function extractPdf(url, finalUrl, body, maxContentLength) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: body });
    let textResult;
    let title = '';
    try {
        textResult = await parser.getText();
        try {
            const infoResult = await parser.getInfo();
            const titleField = infoResult.info?.Title;
            if (typeof titleField === 'string')
                title = titleField;
        }
        catch {
        }
    }
    finally {
        await parser.destroy();
    }
    const truncated = textResult.text.length > maxContentLength;
    const content = truncated ? textResult.text.slice(0, maxContentLength) : textResult.text;
    return {
        url,
        finalUrl,
        title,
        content,
        truncated,
        contentLength: textResult.text.length,
    };
}
function extractPlainText(url, finalUrl, body, maxContentLength) {
    const text = body.toString('utf-8');
    const truncated = text.length > maxContentLength;
    const content = truncated ? text.slice(0, maxContentLength) : text;
    return {
        url,
        finalUrl,
        title: '',
        content,
        truncated,
        contentLength: text.length,
    };
}
function createTurndownService() {
    const TurndownService = loadTurndown();
    const turndown = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
    });
    turndown.use(loadTurndownGfm());
    return turndown;
}
function detectSafetyFlags(html) {
    const flags = {};
    const hasAppRoot = /<div\s+id=["'](?:app|root|__next|__nuxt)["']\s*>/i.test(html);
    const hasNoscript = /<noscript/i.test(html);
    if (hasAppRoot && hasNoscript) {
        flags.jsRenderingSuspected = true;
    }
    const hasLoginForm = /action=["'][^"']*login/i.test(html);
    const hasLoginRedirect = /meta[^>]+url=.*(?:login|signin|auth)/i.test(html);
    if (hasLoginForm || hasLoginRedirect) {
        flags.loginRequired = true;
    }
    return flags;
}
function hasSafetyFlags(flags) {
    return (flags !== undefined && (flags.jsRenderingSuspected === true || flags.loginRequired === true));
}
//# sourceMappingURL=fetch-and-extract.js.map