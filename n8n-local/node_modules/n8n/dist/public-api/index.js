"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPublicApiVersions = void 0;
exports.isApiKeyAuthEnabled = isApiKeyAuthEnabled;
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const express_1 = __importDefault(require("express"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const idempotency_request_1 = require("../idempotency/idempotency-request");
const public_api_controller_registry_1 = require("./public-api-controller.registry");
const public_api_error_response_1 = require("./v1/public-api-error-response");
const license_1 = require("../license");
require("./v1/controllers");
function scopeBadgePlugin() {
    const wrapOperationSummary = (originalComponent, system) => (props) => {
        const pathArr = props.specPath?.toJS ? props.specPath.toJS() : null;
        const op = pathArr ? (system.specSelectors?.specJson().getIn(pathArr) ?? null) : null;
        const rawScope = op?.get ? op.get('x-required-scope') : null;
        const scope = typeof rawScope === 'string' ? rawScope : null;
        const method = pathArr ? pathArr[2] : null;
        const pathStr = pathArr ? pathArr[1] : null;
        system.React.useEffect(() => {
            if (!scope || scope === 'none' || !method || !pathStr)
                return;
            const candidates = document.querySelectorAll('.opblock-summary-' + method);
            let target = null;
            for (const c of candidates) {
                const pathEl = c.querySelector('.opblock-summary-path');
                if (pathEl && pathEl.getAttribute('data-path') === pathStr) {
                    target =
                        c.querySelector('.opblock-summary-path-description-wrapper') ??
                            c.querySelector('.opblock-summary-description');
                    break;
                }
            }
            if (!target)
                return;
            const existing = target.querySelector(':scope > .x-scope-badge');
            if (existing)
                existing.remove();
            const badge = document.createElement('span');
            badge.className = 'x-scope-badge';
            badge.textContent = scope;
            target.appendChild(badge);
            return () => {
                badge.remove();
            };
        }, [scope, method, pathStr]);
        return system.React.createElement(originalComponent, props);
    };
    return { wrapComponents: { OperationSummary: wrapOperationSummary } };
}
function createLazySwaggerMiddleware(openApiSpecPath, publicApiEndpoint, version) {
    let cachedRouter;
    return async (req, res, next) => {
        if (!cachedRouter) {
            const globalConfig = di_1.Container.get(config_1.GlobalConfig);
            const n8nPath = globalConfig.path;
            const YAML = await import('yaml');
            const spec = await promises_1.default.readFile(openApiSpecPath, 'utf-8');
            const swaggerDocument = YAML.parse(spec);
            swaggerDocument.server = [
                {
                    url: `${di_1.Container.get(backend_services_1.UrlService).getInstanceBaseUrl()}/${publicApiEndpoint}/${version}}`,
                },
            ];
            const { serveFiles, setup } = await import('swagger-ui-express');
            const swaggerThemePath = path_1.default.join(__dirname, 'swagger-theme.css');
            const swaggerThemeCss = await promises_1.default.readFile(swaggerThemePath, { encoding: 'utf-8' });
            const swaggerSetupOpts = {
                customCss: swaggerThemeCss,
                customSiteTitle: 'n8n Public API UI',
                customfavIcon: `${n8nPath}favicon.ico`,
                swaggerOptions: {
                    plugins: [scopeBadgePlugin],
                },
            };
            cachedRouter = express_1.default.Router();
            cachedRouter.use(serveFiles(swaggerDocument, swaggerSetupOpts), setup(swaggerDocument, swaggerSetupOpts));
        }
        void cachedRouter(req, res, next);
    };
}
function createPublicControllerMiddleware(version) {
    const router = express_1.default.Router({ mergeParams: true });
    di_1.Container.get(public_api_controller_registry_1.PublicApiControllerRegistry).activate(router, version);
    return router;
}
function createApiRouter(version, openApiSpecPath, publicApiEndpoint) {
    const globalConfig = di_1.Container.get(config_1.GlobalConfig);
    const payloadLimit = `${globalConfig.endpoints.payloadSizeMax}mb`;
    const apiController = express_1.default.Router();
    if (!globalConfig.publicApi.swaggerUiDisabled) {
        apiController.use(`/${publicApiEndpoint}/${version}/docs`, createLazySwaggerMiddleware(openApiSpecPath, publicApiEndpoint, version));
    }
    apiController.get(`/${publicApiEndpoint}/${version}/openapi.yml`, (_, res) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.sendFile(openApiSpecPath);
    });
    const jsonParseErrorHandler = (error, _req, res, next) => {
        if (error instanceof SyntaxError && 'body' in error) {
            res.status(400).json({
                message: 'Invalid JSON in request body',
            });
            return;
        }
        next(error);
    };
    const notFoundHandler = (_req, res) => {
        res.status(404).json({ message: 'not found' });
    };
    apiController.use(`/${publicApiEndpoint}/${version}`, express_1.default.json({
        limit: payloadLimit,
        verify: (req, _res, buf) => {
            (0, idempotency_request_1.rememberRawBody)(req, buf);
        },
    }), jsonParseErrorHandler, createPublicControllerMiddleware(version), notFoundHandler);
    const publicApiErrorHandler = (error, _req, res, _next) => {
        (0, public_api_error_response_1.sendPublicApiErrorResponse)(res, error);
    };
    apiController.use(publicApiErrorHandler);
    return apiController;
}
const loadPublicApiVersions = async (publicApiEndpoint) => {
    const folders = await promises_1.default.readdir(__dirname);
    const versions = folders.filter((folderName) => folderName.startsWith('v'));
    const apiRouters = versions.map((version) => {
        const openApiPath = path_1.default.join(__dirname, version, 'openapi.yml');
        return createApiRouter(version, openApiPath, publicApiEndpoint);
    });
    const version = versions.pop()?.charAt(1);
    return {
        apiRouters,
        apiLatestVersion: version ? Number(version) : 1,
    };
};
exports.loadPublicApiVersions = loadPublicApiVersions;
function isApiKeyAuthEnabled() {
    return !di_1.Container.get(config_1.GlobalConfig).publicApi.disabled && !di_1.Container.get(license_1.License).isAPIDisabled();
}
//# sourceMappingURL=index.js.map