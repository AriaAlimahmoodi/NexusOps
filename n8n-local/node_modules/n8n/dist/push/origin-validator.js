"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateWebSocketOrigin = validateWebSocketOrigin;
exports.validateSseOrigin = validateSseOrigin;
function validateWebSocketOrigin(headers) {
    return validateOriginAgainstExpectedHost(headers);
}
function validateSseOrigin(headers) {
    if (headers.origin === undefined && isSameOriginFetch(headers)) {
        return { isValid: true };
    }
    return validateOriginAgainstExpectedHost(headers);
}
function validateOriginAgainstExpectedHost(headers) {
    const originInfo = parseOrigin(headers.origin ?? '');
    if (!originInfo) {
        return {
            isValid: false,
            error: 'Origin header is missing or malformed',
        };
    }
    let rawExpectedHost;
    let expectedProtocol = originInfo.protocol;
    const forwarded = parseForwardedHeader(headers.forwarded ?? '');
    if (forwarded?.host) {
        rawExpectedHost = forwarded.host;
        if (forwarded.proto) {
            const validatedProto = validateProtocol(forwarded.proto);
            if (validatedProto) {
                expectedProtocol = validatedProto;
            }
        }
    }
    else {
        const xForwardedHost = getFirstHeaderValue(headers['x-forwarded-host']);
        if (xForwardedHost) {
            rawExpectedHost = xForwardedHost;
            const xForwardedProto = getFirstHeaderValue(headers['x-forwarded-proto']);
            if (xForwardedProto) {
                const validatedProto = validateProtocol(xForwardedProto.split(',')[0]?.trim());
                if (validatedProto) {
                    expectedProtocol = validatedProto;
                }
            }
        }
        else {
            rawExpectedHost = headers.host;
        }
    }
    const normalizedExpectedHost = normalizeHost(rawExpectedHost ?? '', expectedProtocol);
    const isValid = normalizedExpectedHost === originInfo.host;
    return {
        isValid,
        originInfo,
        expectedHost: normalizedExpectedHost,
        expectedProtocol,
        rawExpectedHost,
        error: isValid ? undefined : 'Origin header does not match expected host',
    };
}
function normalizeHost(host, protocol) {
    if (!host)
        return host;
    try {
        const url = new URL(`${protocol}://${host}`);
        const defaultPort = protocol === 'https' ? '443' : '80';
        const actualPort = url.port || defaultPort;
        if (actualPort === defaultPort) {
            return stripIPv6Brackets(url.hostname);
        }
        return stripIPv6Brackets(url.host);
    }
    catch {
        return host;
    }
}
function stripIPv6Brackets(hostname) {
    if (hostname.startsWith('[') && hostname.includes(']:')) {
        const closingBracket = hostname.indexOf(']:');
        const ipv6 = hostname.slice(1, closingBracket);
        const port = hostname.slice(closingBracket + 2);
        return `${ipv6}:${port}`;
    }
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
        return hostname.slice(1, -1);
    }
    return hostname;
}
function getFirstHeaderValue(header) {
    if (!header)
        return undefined;
    if (typeof header === 'string')
        return header;
    return header[0];
}
function isSameOriginFetch(headers) {
    return getFirstHeaderValue(headers['sec-fetch-site']) === 'same-origin';
}
function validateProtocol(proto) {
    if (!proto)
        return undefined;
    const normalized = proto.toLowerCase().trim();
    return normalized === 'http' || normalized === 'https' ? normalized : undefined;
}
function parseForwardedHeader(forwardedHeader) {
    if (!forwardedHeader || typeof forwardedHeader !== 'string') {
        return null;
    }
    try {
        const firstEntry = forwardedHeader.split(',')[0]?.trim();
        if (!firstEntry)
            return null;
        const result = {};
        const pairs = firstEntry.split(';');
        for (const pair of pairs) {
            const [key, value] = pair.split('=', 2);
            if (!key || !value)
                continue;
            const cleanKey = key.trim().toLowerCase();
            const cleanValue = value.trim().replace(/^["']|["']$/g, '');
            if (cleanKey === 'host') {
                result.host = cleanValue;
            }
            else if (cleanKey === 'proto') {
                result.proto = cleanValue;
            }
        }
        return result;
    }
    catch {
        return null;
    }
}
function parseOrigin(origin) {
    if (!origin || typeof origin !== 'string') {
        return null;
    }
    try {
        const url = new URL(origin);
        const protocol = url.protocol.toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') {
            return null;
        }
        const protocolName = protocol === 'https:' ? 'https' : 'http';
        const defaultPort = protocolName === 'https' ? '443' : '80';
        const actualPort = url.port || defaultPort;
        const rawHost = actualPort === defaultPort ? url.hostname : url.host;
        const normalizedHost = stripIPv6Brackets(rawHost);
        return {
            protocol: protocolName,
            host: normalizedHost,
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=origin-validator.js.map