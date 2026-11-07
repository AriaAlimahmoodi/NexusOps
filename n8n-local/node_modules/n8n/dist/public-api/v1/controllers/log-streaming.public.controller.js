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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogStreamingPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const event_message_classes_1 = require("../../../eventbus/event-message-classes");
const message_event_bus_1 = require("../../../eventbus/message-event-bus/message-event-bus");
const create_message_event_bus_destination_1 = require("../../../modules/log-streaming.ee/create-message-event-bus-destination");
const destination_credentials_access_1 = require("../../../modules/log-streaming.ee/destinations/destination-credentials-access");
const log_streaming_destination_service_1 = require("../../../modules/log-streaming.ee/log-streaming-destination.service");
const log_streaming_mapper_1 = require("./log-streaming.mapper");
const tags = ['LogStreaming'];
let LogStreamingPublicController = class LogStreamingPublicController {
    constructor(destinationService, eventBus, instanceSettingsLoaderConfig, outboundHttp, credentialsFinderService) {
        this.destinationService = destinationService;
        this.eventBus = eventBus;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
        this.outboundHttp = outboundHttp;
        this.credentialsFinderService = credentialsFinderService;
    }
    async getLogStreamingEventTypes() {
        return { data: event_message_classes_1.eventNamesAll };
    }
    async getLogStreamingDestinations() {
        const destinations = await this.destinationService.findDestination();
        return { data: destinations.map(log_streaming_mapper_1.toLogStreamingDestinationPublic) };
    }
    async getLogStreamingDestination(_req, _res, destinationId) {
        const destination = await this.findDestinationOrFail(destinationId);
        return (0, log_streaming_mapper_1.toLogStreamingDestinationPublic)(destination);
    }
    async createLogStreamingDestination(req, _res, body) {
        this.assertNotManagedByEnv();
        return await this.saveDestination(req.user, (0, log_streaming_mapper_1.toInternalDestinationOptions)(body));
    }
    async updateLogStreamingDestination(req, _res, destinationId, body) {
        this.assertNotManagedByEnv();
        await this.findDestinationOrFail(destinationId);
        return await this.saveDestination(req.user, {
            ...(0, log_streaming_mapper_1.toInternalDestinationOptions)(body),
            id: destinationId,
        });
    }
    async testLogStreamingDestination(req, _res, destinationId) {
        const destination = await this.findDestinationOrFail(destinationId);
        await (0, destination_credentials_access_1.assertUserCanUseDestinationCredentials)(this.credentialsFinderService, req.user, destination);
        try {
            const result = await this.destinationService.testDestination(destinationId);
            return { success: result };
        }
        catch {
            return { success: false };
        }
    }
    async deleteLogStreamingDestination(_req, _res, destinationId) {
        this.assertNotManagedByEnv();
        const destination = await this.findDestinationOrFail(destinationId);
        await this.destinationService.removeDestination(destinationId);
        return (0, log_streaming_mapper_1.toLogStreamingDestinationPublic)(destination);
    }
    assertNotManagedByEnv() {
        if (this.instanceSettingsLoaderConfig.logStreamingManagedByEnv) {
            throw new errors_1.ConflictError('Log streaming destinations are managed via environment variables and cannot be modified through the API');
        }
    }
    async saveDestination(user, options) {
        await (0, destination_credentials_access_1.assertUserCanUseDestinationCredentials)(this.credentialsFinderService, user, options);
        const destination = (0, create_message_event_bus_destination_1.createMessageEventBusDestination)(this.eventBus, this.outboundHttp, options);
        const result = await this.destinationService.addDestination(destination);
        return (0, log_streaming_mapper_1.toLogStreamingDestinationPublic)(result.serialize());
    }
    async findDestinationOrFail(id) {
        const [destination] = await this.destinationService.findDestination(id);
        if (!destination) {
            throw new errors_1.NotFoundError(`Log streaming destination with id "${id}" could not be found`);
        }
        return destination;
    }
};
exports.LogStreamingPublicController = LogStreamingPublicController;
__decorate([
    (0, decorators_1.Get)('/event-types'),
    (0, decorators_1.ApiKeyScope)('eventBusDestination:list'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LOG_STREAMING),
    (0, decorators_1.ApiSummary)('List streamable event types'),
    (0, decorators_1.ApiDescription)('List the event types that can be streamed to a log streaming destination. Requires the `eventBusDestination:list` scope and the Log Streaming feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LogStreamingEventTypesPublicDto),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogStreamingPublicController.prototype, "getLogStreamingEventTypes", null);
__decorate([
    (0, decorators_1.Get)('/destinations'),
    (0, decorators_1.ApiKeyScope)('eventBusDestination:list'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LOG_STREAMING),
    (0, decorators_1.ApiSummary)('List log streaming destinations'),
    (0, decorators_1.ApiDescription)('List the configured log streaming destinations. Requires the `eventBusDestination:list` scope and the Log Streaming feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LogStreamingDestinationListPublicDto),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LogStreamingPublicController.prototype, "getLogStreamingDestinations", null);
__decorate([
    (0, decorators_1.Get)('/destinations/:destinationId'),
    (0, decorators_1.ApiKeyScope)('eventBusDestination:read'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LOG_STREAMING),
    (0, decorators_1.ApiSummary)('Retrieve a log streaming destination'),
    (0, decorators_1.ApiDescription)('Retrieve a single log streaming destination by id. Requires the `eventBusDestination:read` scope and the Log Streaming feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LogStreamingDestinationPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('destinationId', api_types_1.logStreamingDestinationIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], LogStreamingPublicController.prototype, "getLogStreamingDestination", null);
__decorate([
    (0, decorators_1.Post)('/destinations'),
    (0, decorators_1.ApiKeyScope)('eventBusDestination:create'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LOG_STREAMING),
    (0, decorators_1.ApiSummary)('Create a log streaming destination'),
    (0, decorators_1.ApiDescription)('Create a log streaming destination. The destination takes effect exactly as it would from the UI, using the same validation. Requires the `eventBusDestination:create` scope and the Log Streaming feature to be licensed. When destinations are managed via environment variables, the write is rejected with 409 and nothing is created; reads still return the current values.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LogStreamingDestinationPublicDto),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateLogStreamingDestinationPublicDto]),
    __metadata("design:returntype", Promise)
], LogStreamingPublicController.prototype, "createLogStreamingDestination", null);
__decorate([
    (0, decorators_1.Put)('/destinations/:destinationId'),
    (0, decorators_1.ApiKeyScope)('eventBusDestination:update'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LOG_STREAMING),
    (0, decorators_1.ApiSummary)('Update a log streaming destination'),
    (0, decorators_1.ApiDescription)('Replace an existing log streaming destination. The update takes effect exactly as it would from the UI, using the same validation. Requires the `eventBusDestination:update` scope and the Log Streaming feature to be licensed. When destinations are managed via environment variables, the write is rejected with 409 and nothing is changed; reads still return the current values.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LogStreamingDestinationPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('destinationId', api_types_1.logStreamingDestinationIdParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateLogStreamingDestinationPublicDto]),
    __metadata("design:returntype", Promise)
], LogStreamingPublicController.prototype, "updateLogStreamingDestination", null);
__decorate([
    (0, decorators_1.Post)('/destinations/:destinationId/test'),
    (0, decorators_1.ApiKeyScope)('eventBusDestination:test'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LOG_STREAMING),
    (0, decorators_1.ApiSummary)('Send a test message to a log streaming destination'),
    (0, decorators_1.ApiDescription)('Send a test message to the destination to verify it is reachable and configured correctly. Requires the `eventBusDestination:test` scope and the Log Streaming feature to be licensed.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LogStreamingTestResultPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('destinationId', api_types_1.logStreamingDestinationIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], LogStreamingPublicController.prototype, "testLogStreamingDestination", null);
__decorate([
    (0, decorators_1.Delete)('/destinations/:destinationId'),
    (0, decorators_1.ApiKeyScope)('eventBusDestination:delete'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.LOG_STREAMING),
    (0, decorators_1.ApiSummary)('Delete a log streaming destination'),
    (0, decorators_1.ApiDescription)('Remove a log streaming destination. Requires the `eventBusDestination:delete` scope and the Log Streaming feature to be licensed. When destinations are managed via environment variables, the delete is rejected with 409 and nothing is removed; reads still return the current values.'),
    (0, decorators_1.ApiTags)(tags),
    (0, decorators_1.ApiResponse)(200, api_types_1.LogStreamingDestinationPublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    (0, decorators_1.ApiErrorResponse)(409),
    __param(2, (0, decorators_1.Param)('destinationId', api_types_1.logStreamingDestinationIdParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], LogStreamingPublicController.prototype, "deleteLogStreamingDestination", null);
exports.LogStreamingPublicController = LogStreamingPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/settings/log-streaming'),
    __metadata("design:paramtypes", [log_streaming_destination_service_1.LogStreamingDestinationService, message_event_bus_1.MessageEventBus, config_1.InstanceSettingsLoaderConfig, backend_network_1.OutboundHttp, backend_services_1.CredentialsFinderService])
], LogStreamingPublicController);
//# sourceMappingURL=log-streaming.public.controller.js.map