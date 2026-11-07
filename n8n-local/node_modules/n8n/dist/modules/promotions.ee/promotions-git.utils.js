"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPromotionBranchName = buildPromotionBranchName;
exports.buildHttpsGitConfig = buildHttpsGitConfig;
exports.buildSshCommand = buildSshCommand;
exports.generateSshKeyPair = generateSshKeyPair;
exports.checkoutBranchName = checkoutBranchName;
exports.repositoryUrl = repositoryUrl;
exports.buildCacheDescriptor = buildCacheDescriptor;
const backend_network_1 = require("@n8n/backend-network");
const node_crypto_1 = require("node:crypto");
const constants_1 = require("./constants");
function buildPromotionBranchName(now) {
    return `${constants_1.PROMOTION_BRANCH_PREFIX}${now.toISOString().replace(/[:.]/g, '-')}`;
}
const quoteShellArg = (value) => `'${value.replace(/'/g, "'\"'\"'")}'`;
function buildHttpsGitConfig({ repositoryUrl }) {
    const helper = '!f() { printf \'%s\\n\' "username=$N8N_GIT_USERNAME" "password=$N8N_GIT_PASSWORD"; }; f';
    const config = [
        `credential.helper=${helper}`,
        'credential.useHttpPath=true',
        `http.lowSpeedLimit=${constants_1.HTTP_LOW_SPEED_LIMIT_BYTES}`,
        `http.lowSpeedTime=${constants_1.HTTP_LOW_SPEED_TIME_SECONDS}`,
    ];
    const proxyUrl = (0, backend_network_1.resolveProxyUrl)(repositoryUrl);
    if (proxyUrl)
        config.push(`http.proxy=${proxyUrl}`);
    const { GIT_SSL_CAINFO, GIT_SSL_CAPATH } = process.env;
    if (GIT_SSL_CAINFO)
        config.push(`http.sslCAInfo=${GIT_SSL_CAINFO}`);
    if (GIT_SSL_CAPATH)
        config.push(`http.sslCAPath=${GIT_SSL_CAPATH}`);
    return config;
}
function buildSshCommand(paths) {
    const normalizeAndQuote = (value) => quoteShellArg(value.split(/[/\\]/).join('/'));
    const timeouts = `-o ConnectTimeout=${constants_1.SSH_CONNECT_TIMEOUT_SECONDS} -o ServerAliveInterval=${constants_1.SSH_SERVER_ALIVE_INTERVAL_SECONDS} -o ServerAliveCountMax=${constants_1.SSH_SERVER_ALIVE_COUNT_MAX}`;
    return `ssh ${timeouts} -o UserKnownHostsFile=${normalizeAndQuote(paths.knownHostsPath)} -o StrictHostKeyChecking=accept-new -i ${normalizeAndQuote(paths.privateKeyPath)}`;
}
async function generateSshKeyPair(keyType, comment) {
    const { default: sshpk } = await import('sshpk');
    const generated = keyType === 'ed25519'
        ? (0, node_crypto_1.generateKeyPairSync)('ed25519', {
            privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
            publicKeyEncoding: { format: 'pem', type: 'spki' },
        })
        : (0, node_crypto_1.generateKeyPairSync)('rsa', {
            modulusLength: 4096,
            privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
            publicKeyEncoding: { format: 'pem', type: 'spki' },
        });
    const publicKey = sshpk.parseKey(generated.publicKey, 'pem');
    publicKey.comment = comment;
    const privateKey = sshpk.parsePrivateKey(generated.privateKey, 'pem');
    privateKey.comment = comment;
    return {
        publicKey: publicKey.toString('ssh'),
        privateKey: privateKey.toString('ssh-private'),
    };
}
function checkoutBranchName(config) {
    return config.direction === 'apply' ? config.settings.branchName : config.settings.baseBranchName;
}
function repositoryUrl(input) {
    return input.target.remoteUrl;
}
function buildCacheDescriptor(source) {
    return {
        schemaVersion: 1,
        connectionId: source.connectionId,
        configId: source.configId,
        remoteUrl: source.target.remoteUrl,
        checkoutBranchName: checkoutBranchName(source.config),
    };
}
//# sourceMappingURL=promotions-git.utils.js.map