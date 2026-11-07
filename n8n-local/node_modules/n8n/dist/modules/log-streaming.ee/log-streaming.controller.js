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
exports.EventBusController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const backend_services_1 = require("@n8n/backend-services");
const errors_1 = require("@n8n/errors");
const event_message_classes_1 = require("../../eventbus/event-message-classes");
const message_event_bus_1 = require("../../eventbus/message-event-bus/message-event-bus");
const create_message_event_bus_destination_1 = require("./create-message-event-bus-destination");
const destination_credentials_access_1 = require("./destinations/destination-credentials-access");
const log_streaming_destination_service_1 = require("./log-streaming-destination.service");
let EventBusController = class EventBusController {
    constructor(eventBus, destinationService, instanceSettingsLoaderConfig, outboundHttp, credentialsFinderService) {
        this.eventBus = eventBus;
        this.destinationService = destinationService;
        this.instanceSettingsLoaderConfig = instanceSettingsLoaderConfig;
        this.outboundHttp = outboundHttp;
        this.credentialsFinderService = credentialsFinderService;
    }
    assertNotManagedByEnv() {
        if (this.instanceSettingsLoaderConfig.logStreamingManagedByEnv) {
            throw new errors_1.ForbiddenError('Log streaming destinations are managed via environment variables and cannot be modified through the API');
        }
    }
    async getEventNames() {
        return event_message_classes_1.eventNamesAll;
    }
    async getDestination(_req, _res, query) {
        return await this.destinationService.findDestination(query.id);
    }
    async postDestination(req) {
        this.assertNotManagedByEnv();
        const parseResult = api_types_1.CreateDestinationDto.safeParse(req.body);
        if (!parseResult.success) {
            const reported = new Set();
            const message = parseResult.error.issues
                .filter((issue) => {
                const path = issue.path.join('.');
                if (reported.has(path))
                    return false;
                reported.add(path);
                return true;
            })
                .map((issue) => issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message)
                .join('; ');
            throw new errors_1.BadRequestError(message);
        }
        const options = parseResult.data;
        await (0, destination_credentials_access_1.assertUserCanUseDestinationCredentials)(this.credentialsFinderService, req.user, options);
        const destination = (0, create_message_event_bus_destination_1.createMessageEventBusDestination)(this.eventBus, this.outboundHttp, options);
        const result = await this.destinationService.addDestination(destination);
        return result.serialize();
    }
    async sendTestMessage(req, _res, query) {
        const [destination] = await this.destinationService.findDestination(query.id);
        if (destination) {
            await (0, destination_credentials_access_1.assertUserCanUseDestinationCredentials)(this.credentialsFinderService, req.user, destination);
        }
        return await this.destinationService.testDestination(query.id);
    }
    async deleteDestination(_req, _res, query) {
        this.assertNotManagedByEnv();
        await this.destinationService.removeDestination(query.id);
    }
};
exports.EventBusController = EventBusController;
__decorate([
    (0, decorators_1.Get)('/eventnames'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EventBusController.prototype, "getEventNames", null);
__decorate([
    (0, decorators_1.Licensed)('feat:logStreaming'),
    (0, decorators_1.Get)('/destination'),
    (0, decorators_1.GlobalScope)('eventBusDestination:list'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.GetDestinationQueryDto]),
    __metadata("design:returntype", Promise)
], EventBusController.prototype, "getDestination", null);
__decorate([
    (0, decorators_1.Licensed)('feat:logStreaming'),
    (0, decorators_1.Post)('/destination'),
    (0, decorators_1.GlobalScope)('eventBusDestination:create'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventBusController.prototype, "postDestination", null);
__decorate([
    (0, decorators_1.Licensed)('feat:logStreaming'),
    (0, decorators_1.Get)('/testmessage'),
    (0, decorators_1.GlobalScope)('eventBusDestination:test'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.TestDestinationQueryDto]),
    __metadata("design:returntype", Promise)
], EventBusController.prototype, "sendTestMessage", null);
__decorate([
    (0, decorators_1.Licensed)('feat:logStreaming'),
    (0, decorators_1.Delete)('/destination'),
    (0, decorators_1.GlobalScope)('eventBusDestination:delete'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.DeleteDestinationQueryDto]),
    __metadata("design:returntype", Promise)
], EventBusController.prototype, "deleteDestination", null);
exports.EventBusController = EventBusController = __decorate([
    (0, decorators_1.RestController)('/eventbus'),
    __metadata("design:paramtypes", [message_event_bus_1.MessageEventBus, log_streaming_destination_service_1.LogStreamingDestinationService, config_1.InstanceSettingsLoaderConfig, backend_network_1.OutboundHttp, backend_services_1.CredentialsFinderService])
], EventBusController);
//# sourceMappingURL=log-streaming.controller.js.map