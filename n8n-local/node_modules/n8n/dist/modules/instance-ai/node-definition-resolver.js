"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNodeDiscriminators = listNodeDiscriminators;
exports.resolveNodeTypeDefinition = resolveNodeTypeDefinition;
const node_catalog_1 = require("@n8n/ai-utilities/node-catalog");
const backend_common_1 = require("@n8n/backend-common");
const node_fs_1 = require("node:fs");
function getNodesPaths(nodeDefinitionDirs) {
    return nodeDefinitionDirs.map((dir) => (0, backend_common_1.safeJoinPath)(dir, 'nodes'));
}
function findNodeDir(parsed, nodesPaths) {
    for (const nodesPath of nodesPaths) {
        try {
            const nodeDir = (0, backend_common_1.safeJoinPath)(nodesPath, parsed.packageName, parsed.nodeName);
            if ((0, node_fs_1.existsSync)(nodeDir))
                return { nodesPath, nodeDir };
        }
        catch {
            continue;
        }
    }
    if (parsed.nodeName.endsWith('Tool')) {
        const baseName = parsed.nodeName.slice(0, -4);
        for (const nodesPath of nodesPaths) {
            try {
                const nodeDir = (0, backend_common_1.safeJoinPath)(nodesPath, parsed.packageName, baseName);
                if ((0, node_fs_1.existsSync)(nodeDir))
                    return { nodesPath, nodeDir };
            }
            catch {
                continue;
            }
        }
    }
    return null;
}
function getNodeVersions(nodeId, nodeDefinitionDirs) {
    const parsed = (0, node_catalog_1.parseNodeId)(nodeId);
    if (!parsed)
        return [];
    const nodesPaths = getNodesPaths(nodeDefinitionDirs);
    const found = findNodeDir(parsed, nodesPaths);
    if (!found)
        return [];
    try {
        const entries = (0, node_fs_1.readdirSync)(found.nodeDir, { withFileTypes: true });
        const versions = [];
        for (const entry of entries) {
            if (entry.isFile() &&
                entry.name.startsWith('v') &&
                entry.name.endsWith('.ts') &&
                entry.name !== 'index.ts' &&
                !entry.name.endsWith('.schema.js')) {
                versions.push(entry.name.replace('.ts', ''));
            }
            else if (entry.isDirectory() && /^v\d+$/.test(entry.name)) {
                versions.push(entry.name);
            }
        }
        versions.sort((a, b) => (0, node_catalog_1.versionDirToNumber)(b) - (0, node_catalog_1.versionDirToNumber)(a));
        return versions;
    }
    catch {
        return [];
    }
}
function tryResolveNodeFilePath(nodeId, version, nodeDefinitionDirs, discriminators) {
    const parsed = (0, node_catalog_1.parseNodeId)(nodeId);
    if (!parsed)
        return { error: `Invalid node ID format: '${nodeId}'` };
    if (!(0, node_catalog_1.isValidPathComponent)(parsed.packageName) || !(0, node_catalog_1.isValidPathComponent)(parsed.nodeName)) {
        return { error: `Invalid node ID: '${nodeId}'` };
    }
    const nodesPaths = getNodesPaths(nodeDefinitionDirs);
    const found = findNodeDir(parsed, nodesPaths);
    if (!found) {
        return {
            error: `Node type '${nodeId}' not found. Use search-nodes to find the correct node ID.`,
        };
    }
    try {
        return resolveFilePath(nodeId, version, found.nodeDir, nodeDefinitionDirs, discriminators);
    }
    catch {
        return { error: 'Invalid path - path traversal detected' };
    }
}
function resolveResourceOperationFile(nodeId, nodeDir, targetVersion, resources, discriminators) {
    if (!discriminators?.resource || !discriminators?.operation) {
        const index = resources
            .map((resource) => {
            try {
                const ops = (0, node_fs_1.readdirSync)((0, backend_common_1.safeJoinPath)(nodeDir, targetVersion, `resource_${(0, node_catalog_1.toSnakeCase)(resource)}`))
                    .filter((f) => f.startsWith('operation_') && f.endsWith('.ts'))
                    .map((f) => f.replace('operation_', '').replace('.ts', ''));
                return `${resource} (${ops.join(', ')})`;
            }
            catch {
                return resource;
            }
        })
            .join('; ');
        return {
            error: `Node '${nodeId}' requires resource and operation discriminators. Available resource (operations): ${index}.`,
        };
    }
    if (!(0, node_catalog_1.isValidPathComponent)(discriminators.resource) ||
        !(0, node_catalog_1.isValidPathComponent)(discriminators.operation)) {
        return { error: 'Invalid discriminator value' };
    }
    const resourceDir = (0, backend_common_1.safeJoinPath)(nodeDir, targetVersion, `resource_${(0, node_catalog_1.toSnakeCase)(discriminators.resource)}`);
    if (!(0, node_fs_1.existsSync)(resourceDir)) {
        return {
            error: `Invalid resource '${discriminators.resource}' for node '${nodeId}'. Available: ${resources.join(', ')}`,
        };
    }
    const filePath = (0, backend_common_1.safeJoinPath)(nodeDir, targetVersion, `resource_${(0, node_catalog_1.toSnakeCase)(discriminators.resource)}`, `operation_${(0, node_catalog_1.toSnakeCase)(discriminators.operation)}.ts`);
    if (!(0, node_fs_1.existsSync)(filePath)) {
        const ops = (0, node_fs_1.readdirSync)(resourceDir)
            .filter((f) => f.startsWith('operation_') && f.endsWith('.ts'))
            .map((f) => f.replace('operation_', '').replace('.ts', ''));
        return {
            error: `Invalid operation '${discriminators.operation}' for resource '${discriminators.resource}'. Available: ${ops.join(', ')}`,
        };
    }
    return { filePath };
}
function resolveModeFile(nodeId, nodeDir, targetVersion, modes, discriminators) {
    if (!discriminators?.mode) {
        const variants = [...modes]
            .sort()
            .map((mode) => ({
            mode,
            filePath: (0, backend_common_1.safeJoinPath)(nodeDir, targetVersion, `mode_${(0, node_catalog_1.toSnakeCase)(mode)}.ts`),
        }))
            .filter((variant) => (0, node_fs_1.existsSync)(variant.filePath));
        if (variants.length > 0)
            return { modeVariants: variants };
        return {
            error: `Node '${nodeId}' requires mode discriminator. Available modes: ${modes.join(', ')}.`,
        };
    }
    if (!(0, node_catalog_1.isValidPathComponent)(discriminators.mode)) {
        return { error: 'Invalid mode value' };
    }
    const filePath = (0, backend_common_1.safeJoinPath)(nodeDir, targetVersion, `mode_${(0, node_catalog_1.toSnakeCase)(discriminators.mode)}.ts`);
    if (!(0, node_fs_1.existsSync)(filePath)) {
        return {
            error: `Invalid mode '${discriminators.mode}' for node '${nodeId}'. Available: ${modes.join(', ')}`,
        };
    }
    return { filePath };
}
function resolveFilePath(nodeId, version, nodeDir, nodeDefinitionDirs, discriminators) {
    let targetVersion = version;
    if (!targetVersion) {
        const versions = getNodeVersions(nodeId, nodeDefinitionDirs);
        if (versions.length === 0)
            return { error: `No versions found for node '${nodeId}'` };
        targetVersion = versions[0];
    }
    if (!targetVersion.startsWith('v')) {
        targetVersion = `v${targetVersion.replace('.', '')}`;
    }
    else {
        targetVersion = `v${targetVersion.slice(1).replace('.', '')}`;
    }
    if (!(0, node_catalog_1.isValidVersionSegment)(targetVersion)) {
        return { error: `Version '${version}' not found for node '${nodeId}'` };
    }
    const versionDir = (0, backend_common_1.safeJoinPath)(nodeDir, targetVersion);
    const isSplit = (0, node_fs_1.existsSync)(versionDir) && (0, node_fs_1.statSync)(versionDir).isDirectory();
    if (isSplit) {
        const entries = (0, node_fs_1.readdirSync)(versionDir, { withFileTypes: true });
        const resources = entries
            .filter((e) => e.isDirectory() && e.name.startsWith('resource_'))
            .map((e) => e.name.replace('resource_', ''));
        const modes = entries
            .filter((e) => e.isFile() && e.name.startsWith('mode_') && e.name.endsWith('.ts'))
            .map((e) => e.name.replace('mode_', '').replace('.ts', ''));
        if (resources.length > 0) {
            return resolveResourceOperationFile(nodeId, nodeDir, targetVersion, resources, discriminators);
        }
        if (modes.length > 0) {
            return resolveModeFile(nodeId, nodeDir, targetVersion, modes, discriminators);
        }
        return { error: `Node '${nodeId}' has split structure but no recognized discriminators` };
    }
    const filePath = (0, backend_common_1.safeJoinPath)(nodeDir, `${targetVersion}.ts`);
    if (!(0, node_fs_1.existsSync)(filePath)) {
        return { error: `Version '${version}' not found for node '${nodeId}'` };
    }
    return { filePath };
}
function listNodeDiscriminators(nodeId, nodeDefinitionDirs) {
    const parsed = (0, node_catalog_1.parseNodeId)(nodeId);
    if (!parsed)
        return null;
    if (!(0, node_catalog_1.isValidPathComponent)(parsed.packageName) || !(0, node_catalog_1.isValidPathComponent)(parsed.nodeName))
        return null;
    const nodesPaths = getNodesPaths(nodeDefinitionDirs);
    const found = findNodeDir(parsed, nodesPaths);
    if (!found)
        return null;
    const { nodeDir } = found;
    const versions = getNodeVersions(nodeId, nodeDefinitionDirs);
    if (versions.length === 0)
        return null;
    const versionDir = (0, backend_common_1.safeJoinPath)(nodeDir, versions[0]);
    if (!(0, node_fs_1.existsSync)(versionDir) || !(0, node_fs_1.statSync)(versionDir).isDirectory())
        return null;
    const entries = (0, node_fs_1.readdirSync)(versionDir, { withFileTypes: true });
    const resourceDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith('resource_'));
    if (resourceDirs.length === 0)
        return null;
    const resources = resourceDirs.map((dir) => {
        const resourceName = dir.name.replace('resource_', '');
        const resourcePath = (0, backend_common_1.safeJoinPath)(versionDir, dir.name);
        const ops = (0, node_fs_1.readdirSync)(resourcePath)
            .filter((f) => f.startsWith('operation_') && f.endsWith('.ts'))
            .map((f) => f.replace('operation_', '').replace('.ts', ''));
        return { name: resourceName, operations: ops };
    });
    return { resources };
}
function resolveNodeTypeDefinition(nodeId, nodeDefinitionDirs, options) {
    const nodesPaths = getNodesPaths(nodeDefinitionDirs);
    if (!nodesPaths.some((p) => (0, node_fs_1.existsSync)(p))) {
        return {
            content: '',
            error: 'Node types directory not found. Types may not have been generated yet.',
        };
    }
    const discriminators = options
        ? { resource: options.resource, operation: options.operation, mode: options.mode }
        : undefined;
    let result = tryResolveNodeFilePath(nodeId, options?.version, nodeDefinitionDirs, discriminators);
    if (result.error && nodeId.endsWith('Tool')) {
        const baseNodeId = nodeId.slice(0, -4);
        result = tryResolveNodeFilePath(baseNodeId, options?.version, nodeDefinitionDirs, discriminators);
    }
    if (result.error || (!result.filePath && !result.modeVariants)) {
        return { content: '', error: result.error ?? `Node type '${nodeId}' not found.` };
    }
    try {
        if (result.modeVariants) {
            const sections = result.modeVariants.map((variant) => `// ── mode: ${variant.mode} ──
${(0, node_fs_1.readFileSync)(variant.filePath, 'utf-8')}`);
            const header = `// No mode discriminator was given — definitions for all ${String(result.modeVariants.length)} modes of '${nodeId}' follow (pass \`mode\` to fetch a single one).`;
            const actualVersion = result.modeVariants[0].filePath.match(/\/(v\d+)(?:\/|\.ts)/)?.[1];
            return { content: [header, ...sections].join('\n\n'), version: actualVersion };
        }
        const filePath = result.filePath;
        const content = (0, node_fs_1.readFileSync)(filePath, 'utf-8');
        const actualVersion = filePath.match(/\/(v\d+)(?:\/|\.ts)/)?.[1];
        return { content, version: actualVersion };
    }
    catch (error) {
        return {
            content: '',
            error: `Error reading node definition for '${nodeId}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}
//# sourceMappingURL=node-definition-resolver.js.map