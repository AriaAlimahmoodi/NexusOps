"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNpmExecErrorWithStdout = isNpmExecErrorWithStdout;
exports.executeNpmCommand = executeNpmCommand;
exports.executeNpmRequest = executeNpmRequest;
exports.verifyIntegrity = verifyIntegrity;
exports.checkIfVersionExistsOrThrow = checkIfVersionExistsOrThrow;
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const node_child_process_1 = require("node:child_process");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const node_util_1 = require("node:util");
const semver_1 = require("semver");
const constants_1 = require("../../constants");
const asyncExecFile = (0, node_util_1.promisify)(node_child_process_1.execFile);
const REQUEST_TIMEOUT = 30000;
const WINDOWS_NPM_CLI_RELATIVE_PATH = 'node_modules/npm/bin/npm-cli.js';
const WINDOWS_NPM_CLI_CANDIDATE_PATHS = [
    WINDOWS_NPM_CLI_RELATIVE_PATH,
    `../${WINDOWS_NPM_CLI_RELATIVE_PATH}`,
];
const WINDOWS_NPM_PREFIX_SCRIPT_RELATIVE_PATH = 'node_modules/npm/bin/npm-prefix.js';
let cachedWindowsNpmCliPath;
const NPM_ERROR_PATTERNS = {
    PACKAGE_NOT_FOUND: [constants_1.NPM_COMMAND_TOKENS.NPM_PACKAGE_NOT_FOUND_ERROR],
    NO_VERSION_AVAILABLE: [constants_1.NPM_COMMAND_TOKENS.NPM_NO_VERSION_AVAILABLE],
    PACKAGE_VERSION_NOT_FOUND: [constants_1.NPM_COMMAND_TOKENS.NPM_PACKAGE_VERSION_NOT_FOUND_ERROR],
    DISK_NO_SPACE: [constants_1.NPM_COMMAND_TOKENS.NPM_DISK_NO_SPACE],
    DISK_INSUFFICIENT_SPACE: [constants_1.NPM_COMMAND_TOKENS.NPM_DISK_INSUFFICIENT_SPACE],
};
function isDnsError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('getaddrinfo') || message.includes('ENOTFOUND');
}
function isNpmExecErrorWithStdout(error) {
    return typeof error === 'object' && error !== null && 'code' in error && 'stdout' in error;
}
function isNpmError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return (message.includes('npm ERR!') ||
        message.includes('E404') ||
        message.includes('404 Not Found') ||
        message.includes('ENOTFOUND'));
}
function sanitizeRegistryUrl(registryUrl) {
    return registryUrl.replace(/\/+$/, '');
}
function matchesErrorPattern(message, patterns) {
    return patterns.some((pattern) => message.includes(pattern));
}
async function pathExists(path) {
    try {
        await (0, promises_1.access)(path);
        return true;
    }
    catch {
        return false;
    }
}
function stdoutToString(stdout, trim = false) {
    const value = typeof stdout === 'string' ? stdout : stdout.toString();
    return trim ? value.trim() : value;
}
async function resolveWindowsDefaultNpmCliPath(nodeDirectory) {
    for (const relativePath of WINDOWS_NPM_CLI_CANDIDATE_PATHS) {
        const candidatePath = (0, node_path_1.join)(nodeDirectory, relativePath);
        if (await pathExists(candidatePath)) {
            return candidatePath;
        }
    }
    return undefined;
}
async function resolveWindowsPrefixNpmCliPath(nodeDirectory) {
    const npmPrefixScriptPath = (0, node_path_1.join)(nodeDirectory, WINDOWS_NPM_PREFIX_SCRIPT_RELATIVE_PATH);
    if (!(await pathExists(npmPrefixScriptPath))) {
        return undefined;
    }
    try {
        const { stdout } = await asyncExecFile(process.execPath, [npmPrefixScriptPath]);
        const globalPrefix = stdoutToString(stdout, true);
        if (!globalPrefix) {
            return undefined;
        }
        const globalPrefixNpmCliPath = (0, node_path_1.join)(globalPrefix, WINDOWS_NPM_CLI_RELATIVE_PATH);
        if ((0, node_path_1.isAbsolute)(globalPrefixNpmCliPath) && (await pathExists(globalPrefixNpmCliPath))) {
            return globalPrefixNpmCliPath;
        }
    }
    catch {
    }
    return undefined;
}
async function resolveWindowsNpmCliPath() {
    if (cachedWindowsNpmCliPath) {
        return cachedWindowsNpmCliPath;
    }
    const nodeDirectory = (0, node_path_1.dirname)(process.execPath);
    const prefixNpmCliPath = await resolveWindowsPrefixNpmCliPath(nodeDirectory);
    if (prefixNpmCliPath) {
        cachedWindowsNpmCliPath = prefixNpmCliPath;
        return cachedWindowsNpmCliPath;
    }
    const defaultNpmCliPath = await resolveWindowsDefaultNpmCliPath(nodeDirectory);
    if (defaultNpmCliPath) {
        cachedWindowsNpmCliPath = defaultNpmCliPath;
        return cachedWindowsNpmCliPath;
    }
    throw new n8n_workflow_1.UnexpectedError('Failed to locate npm CLI. Please ensure npm is installed.');
}
async function executeNpmCli(args, cwd) {
    if (process.platform === 'win32') {
        const npmCliPath = await resolveWindowsNpmCliPath();
        const { stdout } = await asyncExecFile(process.execPath, [npmCliPath, ...args], cwd ? { cwd } : undefined);
        return stdoutToString(stdout);
    }
    const { stdout } = await asyncExecFile('npm', args, cwd ? { cwd } : undefined);
    return stdoutToString(stdout);
}
function redactAuthTokens(text) {
    return text.replace(/_authToken=\S+/g, '_authToken=*****');
}
function registryAuthKey(registryUrl) {
    const url = new URL(registryUrl);
    const pathname = url.pathname.replace(/\/+$/, '');
    return `${url.host}${pathname}`;
}
async function executeNpmCommand(args, options = {}) {
    const { cwd, doNotHandleError, registry, authToken } = options;
    const registryArgs = [];
    if (registry) {
        const sanitized = sanitizeRegistryUrl(registry);
        registryArgs.push(`--registry=${sanitized}`);
        if (authToken)
            registryArgs.push(`--//${registryAuthKey(sanitized)}/:_authToken=${authToken}`);
    }
    const fullArgs = [...args, ...registryArgs];
    n8n_workflow_1.LoggerProxy.debug('Executing npm command', {
        args: fullArgs.map((a) => (a.includes('_authToken=') ? a.replace(/=.+$/, '=*****') : a)),
        cwd,
    });
    try {
        return await executeNpmCli(fullArgs, cwd);
    }
    catch (error) {
        if (authToken && error instanceof Error) {
            error.message = redactAuthTokens(error.message);
        }
        if (doNotHandleError) {
            throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        n8n_workflow_1.LoggerProxy.warn('Failed to execute npm command', { errorMessage });
        if (matchesErrorPattern(errorMessage, NPM_ERROR_PATTERNS.PACKAGE_NOT_FOUND)) {
            throw new n8n_workflow_1.UnexpectedError(constants_1.RESPONSE_ERROR_MESSAGES.PACKAGE_NOT_FOUND);
        }
        if (matchesErrorPattern(errorMessage, NPM_ERROR_PATTERNS.NO_VERSION_AVAILABLE)) {
            throw new n8n_workflow_1.UnexpectedError(constants_1.RESPONSE_ERROR_MESSAGES.PACKAGE_NOT_FOUND);
        }
        if (matchesErrorPattern(errorMessage, NPM_ERROR_PATTERNS.PACKAGE_VERSION_NOT_FOUND)) {
            throw new n8n_workflow_1.UnexpectedError(constants_1.RESPONSE_ERROR_MESSAGES.PACKAGE_VERSION_NOT_FOUND);
        }
        if (matchesErrorPattern(errorMessage, NPM_ERROR_PATTERNS.DISK_NO_SPACE) ||
            matchesErrorPattern(errorMessage, NPM_ERROR_PATTERNS.DISK_INSUFFICIENT_SPACE)) {
            throw new n8n_workflow_1.UnexpectedError(constants_1.RESPONSE_ERROR_MESSAGES.DISK_IS_FULL);
        }
        if (isDnsError(error)) {
            throw new n8n_workflow_1.UnexpectedError('Network error: Unable to reach npm registry. Please check your internet connection.');
        }
        throw new n8n_workflow_1.UnexpectedError('Failed to execute npm command', { cause: error });
    }
}
async function executeNpmRequest(registryUrl, path, options = {}) {
    const { authToken, headers: extraHeaders, timeout = REQUEST_TIMEOUT } = options;
    const url = `${sanitizeRegistryUrl(registryUrl)}/${path}`;
    const authHeaders = authToken ? { ['Authorization']: `Bearer ${authToken}` } : {};
    const headers = { ...extraHeaders, ...authHeaders };
    const redactedHeaders = authToken
        ? { ...headers, Authorization: 'Bearer *****' }
        : { ...headers };
    n8n_workflow_1.LoggerProxy.debug('Executing npm registry request', { url, headers: redactedHeaders, timeout });
    try {
        const data = (await di_1.Container.get(backend_network_1.OutboundHttp)
            .requests()
            .request({
            url,
            method: 'GET',
            timeout,
            headers: Object.keys(headers).length > 0 ? headers : undefined,
            json: true,
        }));
        return data;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        n8n_workflow_1.LoggerProxy.warn('Failed to execute npm registry request', { url, errorMessage });
        throw error;
    }
}
async function verifyIntegrity(packageName, version, registryUrl, expectedIntegrity, authToken) {
    const path = `${encodeURIComponent(packageName)}/${version}`;
    try {
        const metadata = await executeNpmRequest(registryUrl, path, {
            authToken,
        });
        const integrity = metadata?.dist?.integrity;
        if (integrity !== expectedIntegrity) {
            throw new n8n_workflow_1.UnexpectedError('Checksum verification failed. Package integrity does not match. Try restarting n8n and attempting the installation again.');
        }
        return;
    }
    catch (error) {
        try {
            const stdout = await executeNpmCommand(['view', `${packageName}@${version}`, 'dist.integrity', '--json'], { doNotHandleError: true, registry: registryUrl, authToken });
            const integrity = (0, n8n_workflow_1.jsonParse)(stdout);
            if (integrity !== expectedIntegrity) {
                throw new n8n_workflow_1.UnexpectedError('Checksum verification failed. Package integrity does not match. Try restarting n8n and attempting the installation again.');
            }
            return;
        }
        catch (cliError) {
            if (isDnsError(cliError) || isNpmError(cliError)) {
                throw new n8n_workflow_1.UnexpectedError('Failed to verify package checksum: The registry is temporarily unreachable. Please try again later.');
            }
            throw new n8n_workflow_1.UnexpectedError('Failed to verify package checksum. Try restarting n8n and attempting the installation again.');
        }
    }
}
async function checkIfVersionExistsOrThrow(packageName, version, registryUrl, authToken) {
    const path = `${encodeURIComponent(packageName)}/${version}`;
    try {
        await executeNpmRequest(registryUrl, path, { authToken });
        return true;
    }
    catch (error) {
        try {
            const stdout = await executeNpmCommand(['view', `${packageName}@${version}`, 'version', '--json'], { doNotHandleError: true, registry: registryUrl, authToken });
            const resolvedVersion = (0, n8n_workflow_1.jsonParse)(stdout);
            const isResolvedSemver = typeof resolvedVersion === 'string' && (0, semver_1.valid)(resolvedVersion) !== null;
            const isExactSemver = (0, semver_1.valid)(version) !== null;
            if (isResolvedSemver && (!isExactSemver || resolvedVersion)) {
                return true;
            }
            throw new n8n_workflow_1.UnexpectedError('Failed to check package version existence');
        }
        catch (cliError) {
            const message = cliError instanceof Error ? cliError.message : String(cliError);
            if (message.includes('E404') || message.includes('404 Not Found')) {
                throw new n8n_workflow_1.UnexpectedError('Package version does not exist');
            }
            if (isDnsError(cliError) || isNpmError(cliError)) {
                throw new n8n_workflow_1.UnexpectedError('The community nodes service is temporarily unreachable. Please try again later.');
            }
            throw new n8n_workflow_1.UnexpectedError('Failed to check package version existence');
        }
    }
}
//# sourceMappingURL=npm-utils.js.map