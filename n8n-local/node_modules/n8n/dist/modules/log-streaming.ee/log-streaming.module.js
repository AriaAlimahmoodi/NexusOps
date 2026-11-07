"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogStreamingModule = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let LogStreamingModule = class LogStreamingModule {
    async init() {
        await import('./log-streaming.controller.js');
        const { LogStreamingDestinationService } = await import('./log-streaming-destination.service.js');
        const destinationService = di_1.Container.get(LogStreamingDestinationService);
        await destinationService.loadDestinationsFromDb();
        await destinationService.initialize();
    }
    async entities() {
        const { EventDestinations } = await import('./database/entities/event-destination.entity.js');
        return [EventDestinations];
    }
};
exports.LogStreamingModule = LogStreamingModule;
exports.LogStreamingModule = LogStreamingModule = __decorate([
    (0, decorators_1.BackendModule)({
        name: 'log-streaming',
        licenseFlag: constants_1.LICENSE_FEATURES.LOG_STREAMING,
        instanceTypes: ['main', 'worker', 'webhook'],
    })
], LogStreamingModule);
//# sourceMappingURL=log-streaming.module.js.map