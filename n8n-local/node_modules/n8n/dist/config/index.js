"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const convict_1 = __importDefault(require("convict"));
const fs_1 = require("fs");
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const globalConfig = di_1.Container.get(config_1.GlobalConfig);
(0, utils_1.setMicrosoftObservabilityDefaults)();
if (constants_1.inE2ETests) {
    globalConfig.diagnostics.enabled = false;
    process.env.EXTERNAL_FRONTEND_HOOKS_URLS = '';
    process.env.N8N_PERSONALIZATION_ENABLED = 'false';
    process.env.N8N_AI_ENABLED = 'true';
}
else if (backend_common_1.inTest) {
    globalConfig.logging.level = 'silent';
    process.env.SKIP_STATISTICS_EVENTS = 'true';
    globalConfig.auth.cookie.secure = false;
    process.env.N8N_SKIP_AUTH_ON_OAUTH_CALLBACK = 'false';
}
const schema_1 = require("./schema");
const config = (0, convict_1.default)(schema_1.schema, { args: [] });
config.getEnv = config.get;
if (!constants_1.inE2ETests && !backend_common_1.inTest) {
    Object.entries(process.env).forEach(([envName, fileName]) => {
        if (envName.endsWith('_FILE') && fileName) {
            const configEnvName = envName.replace(/_FILE$/, '');
            const key = config._env[configEnvName]?.[0];
            if (key) {
                let value;
                try {
                    value = (0, fs_1.readFileSync)(fileName, 'utf8');
                }
                catch (error) {
                    if (error.code === 'ENOENT') {
                        throw new n8n_workflow_1.UserError('File not found', { extra: { fileName } });
                    }
                    throw error;
                }
                if (value !== value.trim()) {
                    console.warn(`[n8n] Warning: The file specified by ${envName} contains leading or trailing whitespace, which may cause authentication failures.`);
                }
                config.set(key, value);
            }
        }
    });
}
(0, n8n_workflow_1.setGlobalState)({
    defaultTimezone: globalConfig.generic.timezone,
});
exports.default = config;
//# sourceMappingURL=index.js.map