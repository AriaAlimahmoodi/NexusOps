"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DECORATOR_ROOT_FILENAME = void 0;
exports.buildArtifactsFromRegistry = buildArtifactsFromRegistry;
exports.registerSharedSchemas = registerSharedSchemas;
exports.getGeneratedArtifacts = getGeneratedArtifacts;
exports.generateDocs = generateDocs;
exports.assembleSpec = assembleSpec;
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
const n8n_workflow_1 = require("n8n-workflow");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const yaml_1 = require("yaml");
const decorator_routes_1 = require("./decorator-routes");
const schema_modifiers_1 = require("./schema-modifiers");
const COMPONENT_SCHEMA_REF = /^#\/components\/schemas\/(.+)$/;
const SHARED_SCHEMA_DIR = 'shared/spec/schemas';
const YAML_OPTS = { aliasDuplicateObjects: false, singleQuote: true, lineWidth: 0 };
exports.DECORATOR_ROOT_FILENAME = 'openapi.decorator-routes.generated.yml';
function schemaFileName(componentName) {
    return `${componentName[0].toLowerCase()}${componentName.slice(1)}.generated.yml`;
}
function rewriteComponentRefs(node, toRef) {
    if (Array.isArray(node)) {
        node.forEach((item) => rewriteComponentRefs(item, toRef));
        return;
    }
    if (node === null || typeof node !== 'object') {
        return;
    }
    const record = node;
    Object.entries(record).forEach(([key, value]) => {
        const match = key === '$ref' && typeof value === 'string' && COMPONENT_SCHEMA_REF.exec(value);
        if (match) {
            record[key] = toRef(match[1]);
        }
        else {
            rewriteComponentRefs(value, toRef);
        }
    });
}
function buildArtifactsFromRegistry(registry, operations) {
    const document = new zod_to_openapi_1.OpenApiGeneratorV3(registry.definitions).generateDocument({
        openapi: '3.0.0',
        info: { title: 'throwaway', version: '0.0.0' },
    });
    (0, schema_modifiers_1.applySchemaModifiers)(document);
    const artifacts = [];
    Object.entries(document.components?.schemas ?? {}).forEach(([componentName, schema]) => {
        rewriteComponentRefs(schema, schemaFileName);
        artifacts.push({
            outputPath: `${SHARED_SCHEMA_DIR}/${schemaFileName(componentName)}`,
            content: (0, yaml_1.stringify)(schema, YAML_OPTS),
        });
    });
    operations.forEach(({ outputPath, pathKey, method }) => {
        const operation = document.paths?.[pathKey]?.[method];
        rewriteComponentRefs(operation, (componentName) => node_path_1.default.posix.relative(node_path_1.default.posix.dirname(outputPath), `${SHARED_SCHEMA_DIR}/${schemaFileName(componentName)}`));
        artifacts.push({ outputPath, content: (0, yaml_1.stringify)(operation, YAML_OPTS) });
    });
    return artifacts;
}
function registerSharedSchemas(registry, sharedResponseSchemas) {
    const sharedZodSchemas = new Map();
    const dtoByComponentName = new Map();
    sharedResponseSchemas.forEach((schema, dto) => {
        const clashing = dtoByComponentName.get(dto.name);
        if (clashing && clashing !== dto) {
            throw new n8n_workflow_1.UnexpectedError(`Two different shared response DTOs are both named '${dto.name}' - their generated ` +
                'OpenAPI component names would collide. Rename one of the DTO classes.');
        }
        dtoByComponentName.set(dto.name, dto);
        sharedZodSchemas.set(dto, registry.register(dto.name, schema));
    });
    return sharedZodSchemas;
}
function buildDecoratorRootDocument(operations) {
    const paths = {};
    operations.forEach(({ pathKey, method, outputPath }) => {
        const pathItem = (paths[pathKey] ??= {});
        if (pathItem[method]) {
            throw new n8n_workflow_1.UnexpectedError(`Two @PublicApiController routes both map to ${method.toUpperCase()} ${pathKey}.`);
        }
        pathItem[method] = { $ref: `./${outputPath}` };
    });
    assertConsistentPathParameterNames(paths);
    return { openapi: '3.0.0', info: { title: 'decorator-routes', version: '0.0.0' }, paths };
}
function getGeneratedArtifacts() {
    const registry = new zod_to_openapi_1.OpenAPIRegistry();
    const sharedZodSchemas = registerSharedSchemas(registry, (0, decorator_routes_1.getSharedResponseSchemas)());
    const resolveSchema = (dto, schema) => sharedZodSchemas.get(dto) ?? schema;
    const operations = (0, decorator_routes_1.getDecoratorGeneratedOperations)(resolveSchema);
    operations.forEach(({ config }) => registry.registerPath(config));
    const artifacts = buildArtifactsFromRegistry(registry, operations.map(({ outputPath, pathKey, method }) => ({ outputPath, pathKey, method })));
    artifacts.push({
        outputPath: exports.DECORATOR_ROOT_FILENAME,
        content: (0, yaml_1.stringify)(buildDecoratorRootDocument(operations), YAML_OPTS),
    });
    return artifacts;
}
function generateDocs(v1Dir) {
    const artifacts = getGeneratedArtifacts();
    artifacts.forEach(({ outputPath, content }) => {
        const fullPath = node_path_1.default.join(v1Dir, outputPath);
        node_fs_1.default.mkdirSync(node_path_1.default.dirname(fullPath), { recursive: true });
        node_fs_1.default.writeFileSync(fullPath, content);
    });
}
function assertConsistentPathParameterNames(paths) {
    const PATH_PARAMETER_REGEX = /\{([^}]+)\}/g;
    const pathByShape = new Map();
    for (const pathKey of Object.keys(paths ?? {})) {
        const pathShape = pathKey.replace(PATH_PARAMETER_REGEX, '{}');
        const equivalentPath = pathByShape.get(pathShape);
        if (equivalentPath && equivalentPath !== pathKey) {
            throw new n8n_workflow_1.UnexpectedError(`Equivalent OpenAPI paths use different parameter names: '${equivalentPath}' and ` +
                `'${pathKey}'. Use the same parameter name in both paths.`);
        }
        pathByShape.set(pathShape, pathKey);
    }
}
function assembleSpec(envelope, generated) {
    const envelopePaths = Object.keys(envelope.paths ?? {});
    if (envelopePaths.length > 0) {
        throw new n8n_workflow_1.UnexpectedError(`openapi.yml still declares paths (${envelopePaths.join(', ')}). Paths come from the generated spec.`);
    }
    const generatedPaths = generated.paths ?? {};
    if (Object.keys(generatedPaths).length === 0) {
        throw new n8n_workflow_1.UnexpectedError('The bundled generated spec has no paths.');
    }
    const components = { ...generated.components };
    for (const [section, items] of Object.entries(envelope.components ?? {})) {
        const target = { ...(components[section] ?? {}) };
        for (const name of Object.keys(items)) {
            if (name in target) {
                throw new n8n_workflow_1.UnexpectedError(`OpenAPI component components.${section}.${name} is defined by both the envelope and a ` +
                    'generated route. Remove one of them.');
            }
        }
        components[section] = { ...target, ...items };
    }
    return { ...envelope, paths: generatedPaths, components };
}
//# sourceMappingURL=generate.js.map