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
exports.EventBusUnsentMessageFlushTask = void 0;
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const message_event_bus_1 = require("./message-event-bus");
let EventBusUnsentMessageFlushTask = class EventBusUnsentMessageFlushTask {
    constructor(globalConfig, eventBus) {
        this.globalConfig = globalConfig;
        this.eventBus = eventBus;
        this.name = 'event-bus-unsent-message-flush';
        this.schedule = (0, decorators_1.intervalFromMilliseconds)(this.globalConfig.eventBus.checkUnsentInterval);
        this.target = (0, decorators_1.instanceTarget)(['main', 'worker', 'webhook']);
    }
    async run() {
        await this.eventBus.trySendingUnsent();
    }
};
exports.EventBusUnsentMessageFlushTask = EventBusUnsentMessageFlushTask;
exports.EventBusUnsentMessageFlushTask = EventBusUnsentMessageFlushTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, message_event_bus_1.MessageEventBus])
], EventBusUnsentMessageFlushTask);
//# sourceMappingURL=event-bus-unsent-message-flush.task.js.map