"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogStreamingInstanceSettingsLoader = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const entities_1 = require("../../modules/log-streaming.ee/database/entities");
const event_destination_repository_1 = require("../../modules/log-streaming.ee/database/repositories/event-destination.repository");
const instance_bootstrapping_error_1 = require("../instance-bootstrapping.error");
const envWebhookSchema = n8n_workflow_1.MessageEventBusDestinationWebhookOptionsSchema.omit({ __type: true })
    .extend({
    type: zod_1.z.literal('webhook'),
    id: zod_1.z.string().uuid().optional(),
    url: n8n_workflow_1.storedDestinationHostSchemas.url,
})
    .strict();
const envSyslogSchema = n8n_workflow_1.MessageEventBusDestinationSyslogOptionsSchema.omit({ __type: true })
    .extend({
    type: zod_1.z.literal('syslog'),
    id: zod_1.z.string().uuid().optional(),
    host: n8n_workflow_1.storedDestinationHostSchemas.host,
})
    .strict();
const envSentrySchema = n8n_workflow_1.MessageEventBusDestinationSentryOptionsSchema.omit({ __type: true })
    .extend({
    type: zod_1.z.literal('sentry'),
    id: zod_1.z.string().uuid().optional(),
    dsn: n8n_workflow_1.storedDestinationHostSchemas.url,
})
    .strict();
const envDestinationSchema = zod_1.z.discriminatedUnion('type', [
    envWebhookSchema,
    envSyslogSchema,
    envSentrySchema,
]);
const envDestinationsSchema = zod_1.z.array(envDestinationSchema);
const TYPE_TO_INTERNAL = {
    webhook: "$$MessageEventBusDestinationWebhook",
    syslog: "$$MessageEventBusDestinationSyslog",
    sentry: "$$MessageEventBusDestinationSentry",
};
function toDestinationOptions(env, id) {
    const { type, id: _ignored, ...rest } = env;
    return {
        ...rest,
        __type: TYPE_TO_INTERNAL[type],
        id,
    };
}
let LogStreamingInstanceSettingsLoader = class LogStreamingInstanceSettingsLoader {
    constructor(config, eventDestinationsRepository, logger) {
        this.config = config;
        this.eventDestinationsRepository = eventDestinationsRepository;
        this.logger = logger;
        this.logger = this.logger.scoped('instance-settings-loader');
    }
    async run() {
        if (!this.config.logStreamingManagedByEnv) {
            this.logger.debug('logStreamingManagedByEnv is disabled — skipping log streaming destinations env config');
            return 'skipped';
        }
        this.logger.info('logStreamingManagedByEnv is enabled — replacing log streaming destinations from env vars');
        let items = [];
        try {
            items = this.parseAndValidate(this.config.logStreamingDestinations);
        }
        catch (error) {
            const message = error.message ?? 'Unknown error';
            this.logger.error(message);
            throw new instance_bootstrapping_error_1.InstanceBootstrappingError(message);
        }
        await this.eventDestinationsRepository.manager.transaction(async (tx) => {
            await this.replace(tx, items);
        });
        return 'created';
    }
    parseAndValidate(raw) {
        const trimmed = (raw ?? '').trim();
        if (trimmed.length === 0)
            return [];
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        }
        catch (error) {
            throw new Error(`N8N_LOG_STREAMING_DESTINATIONS is not valid JSON: ${error.message}`);
        }
        const result = envDestinationsSchema.safeParse(parsed);
        if (!result.success) {
            const issue = result.error.issues[0];
            const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
            throw new Error(`N8N_LOG_STREAMING_DESTINATIONS validation failed at "${path}": ${issue.message}`);
        }
        const items = result.data;
        const seenIds = new Set();
        items.forEach((item, index) => {
            if (item.id) {
                if (seenIds.has(item.id)) {
                    throw new Error(`N8N_LOG_STREAMING_DESTINATIONS has duplicate id "${item.id}" at index ${index}`);
                }
                seenIds.add(item.id);
            }
        });
        return items;
    }
    async replace(tx, items) {
        await tx.delete(entities_1.EventDestinations, {});
        if (items.length === 0)
            return;
        const rows = items.map((item) => {
            const id = item.id ?? (0, uuid_1.v4)();
            return {
                id,
                destination: toDestinationOptions(item, id),
            };
        });
        await tx.insert(entities_1.EventDestinations, rows);
    }
};
exports.LogStreamingInstanceSettingsLoader = LogStreamingInstanceSettingsLoader;
exports.LogStreamingInstanceSettingsLoader = LogStreamingInstanceSettingsLoader = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.InstanceSettingsLoaderConfig, event_destination_repository_1.EventDestinationsRepository, backend_common_1.Logger])
], LogStreamingInstanceSettingsLoader);
//# sourceMappingURL=log-streaming.instance-settings-loader.js.map