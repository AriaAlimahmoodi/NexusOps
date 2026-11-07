"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUrlsCheckFn = exports.urls = void 0;
function ipToInt(ip) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((part) => part < 0 || part > 255)) {
        throw new Error(`Invalid IP address: ${ip}`);
    }
    return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}
function detectUrls(text) {
    const PUNCTUATION_CLEANUP = /[.,;:!?)\\]]+$/;
    const detectedUrls = [];
    const schemePatterns = [
        /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
        /ftp:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
        /data:[^\s<>"{}|\\^`\[\]]+/gi,
        /javascript:[^\s<>"{}|\\^`\[\]]+/gi,
        /vbscript:[^\s<>"{}|\\^`\[\]]+/gi,
        /mailto:[^\s<>"{}|\\^`\[\]]+/gi,
    ];
    const schemeUrls = new Set();
    for (const pattern of schemePatterns) {
        const matches = text.match(pattern) || [];
        for (let match of matches) {
            match = match.replace(PUNCTUATION_CLEANUP, '');
            if (match) {
                detectedUrls.push(match);
                if (match.includes('://')) {
                    const domainPart = match.split('://', 2)[1].split('/')[0].split('?')[0].split('#')[0];
                    schemeUrls.add(domainPart.toLowerCase());
                }
            }
        }
    }
    const domainPattern = /\b(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
    const domainMatches = text.match(domainPattern) || [];
    for (let match of domainMatches) {
        match = match.replace(PUNCTUATION_CLEANUP, '');
        if (match) {
            const domainPart = match.split('/')[0].split('?')[0].split('#')[0].toLowerCase();
            if (!schemeUrls.has(domainPart)) {
                detectedUrls.push(match);
            }
        }
    }
    const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?(?:\/[^\s]*)?/g;
    const ipMatches = text.match(ipPattern) || [];
    for (let match of ipMatches) {
        match = match.replace(PUNCTUATION_CLEANUP, '');
        if (match) {
            const ipPart = match.split('/')[0].split('?')[0].split('#')[0].toLowerCase();
            if (!schemeUrls.has(ipPart)) {
                detectedUrls.push(match);
            }
        }
    }
    const finalUrls = [];
    const schemeUrlDomains = new Set();
    for (const url of detectedUrls) {
        if (url.includes('://')) {
            try {
                const parsed = new URL(url);
                if (parsed.hostname) {
                    schemeUrlDomains.add(parsed.hostname.toLowerCase());
                    const bareDomain = parsed.hostname.toLowerCase().replace(/^www\./, '');
                    schemeUrlDomains.add(bareDomain);
                }
            }
            catch (error) {
            }
            finalUrls.push(url);
        }
    }
    for (const url of detectedUrls) {
        if (!url.includes('://')) {
            const urlLower = url.toLowerCase().replace(/^www\./, '');
            if (!schemeUrlDomains.has(urlLower)) {
                finalUrls.push(url);
            }
        }
    }
    return [...new Set(finalUrls.filter((url) => url))];
}
function validateUrlSecurity(urlString, config) {
    try {
        let parsedUrl;
        let originalScheme;
        if (urlString.includes('://')) {
            parsedUrl = new URL(urlString);
            originalScheme = parsedUrl.protocol.replace(':', '');
        }
        else if (urlString.includes(':') &&
            urlString.split(':', 1)[0].match(/^(data|javascript|vbscript|mailto)$/)) {
            parsedUrl = new URL(urlString);
            originalScheme = parsedUrl.protocol.replace(':', '');
        }
        else {
            parsedUrl = new URL(`http://${urlString}`);
            originalScheme = 'http';
        }
        if (!parsedUrl.protocol) {
            return { parsedUrl: null, reason: 'Invalid URL format' };
        }
        const specialSchemes = new Set(['data:', 'javascript:', 'vbscript:', 'mailto:']);
        if (!specialSchemes.has(parsedUrl.protocol) && !parsedUrl.hostname) {
            return { parsedUrl: null, reason: 'Invalid URL format' };
        }
        if (!config.allowedSchemes.includes(originalScheme)) {
            return { parsedUrl: null, reason: `Blocked scheme: ${originalScheme}` };
        }
        if (config.blockUserinfo && (parsedUrl.username || parsedUrl.password)) {
            return { parsedUrl: null, reason: 'Contains userinfo (potential credential injection)' };
        }
        return { parsedUrl, reason: '' };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { parsedUrl: null, reason: `Invalid URL format: ${errorMessage}` };
    }
}
function isUrlAllowed(parsedUrl, allowList, allowSubdomains) {
    if (allowList.length === 0) {
        return false;
    }
    const urlHost = parsedUrl.hostname?.toLowerCase();
    if (!urlHost) {
        return false;
    }
    for (const allowedEntry of allowList) {
        const entry = allowedEntry.toLowerCase().trim();
        if (entry.includes('://')) {
            try {
                const allowedUrl = new URL(entry);
                const allowedHost = allowedUrl.hostname?.toLowerCase();
                const allowedPath = allowedUrl.pathname;
                if (urlHost === allowedHost) {
                    if (!allowedPath || allowedPath === '/' || parsedUrl.pathname.startsWith(allowedPath)) {
                        return true;
                    }
                }
            }
            catch (error) {
                throw new Error(`Invalid URL in allow list: "${entry}" - ${error instanceof Error ? error.message : error}`);
            }
            continue;
        }
        try {
            if (/^\d+\.\d+\.\d+\.\d+/.test(entry.split('/')[0])) {
                if (entry === urlHost) {
                    return true;
                }
                if (entry.includes('/') && urlHost.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                    const [network, prefixStr] = entry.split('/');
                    const prefix = parseInt(prefixStr);
                    if (prefix >= 0 && prefix <= 32) {
                        const networkInt = ipToInt(network);
                        const hostInt = ipToInt(urlHost);
                        const mask = (0xffffffff << (32 - prefix)) >>> 0;
                        if ((networkInt & mask) === (hostInt & mask)) {
                            return true;
                        }
                    }
                }
                continue;
            }
        }
        catch (error) {
            if (/^\d+\.\d+/.test(entry)) {
                console.warn(`Warning: Malformed IP address in allow list: "${entry}" - ${error instanceof Error ? error.message : error}`);
            }
        }
        const allowedDomain = entry.replace(/^www\./, '');
        const urlDomain = urlHost.replace(/^www\./, '');
        if (urlDomain === allowedDomain) {
            return true;
        }
        if (allowSubdomains && urlDomain.endsWith(`.${allowedDomain}`)) {
            return true;
        }
    }
    return false;
}
const urls = (data, config) => {
    const detectedUrls = detectUrls(data);
    const allowed = [];
    const blocked = [];
    const blockedReasons = [];
    for (const urlString of detectedUrls) {
        const { parsedUrl, reason } = validateUrlSecurity(urlString, config);
        if (parsedUrl === null) {
            blocked.push(urlString);
            blockedReasons.push(`${urlString}: ${reason}`);
            continue;
        }
        const hostlessSchemes = new Set(['data:', 'javascript:', 'vbscript:', 'mailto:']);
        if (hostlessSchemes.has(parsedUrl.protocol)) {
            allowed.push(urlString);
        }
        else if (isUrlAllowed(parsedUrl, config.allowedUrls, config.allowSubdomains)) {
            allowed.push(urlString);
        }
        else {
            blocked.push(urlString);
            blockedReasons.push(`${urlString}: Not in allow list`);
        }
    }
    const tripwireTriggered = blocked.length > 0;
    return {
        guardrailName: 'urls',
        tripwireTriggered,
        info: {
            maskEntities: {
                URL: blocked,
            },
            detected: detectedUrls,
            allowed,
            blocked,
            blockedReasons,
        },
    };
};
exports.urls = urls;
const createUrlsCheckFn = (config) => (input) => (0, exports.urls)(input, config);
exports.createUrlsCheckFn = createUrlsCheckFn;
//# sourceMappingURL=urls.js.map