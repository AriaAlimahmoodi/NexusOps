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
exports.EngineLifecycleEventController = void 0;
const di_1 = require("@n8n/di");
const engine_1 = require("@n8n/engine");
const errors_1 = require("@n8n/errors");
const engine_lifecycle_event_push_relay_1 = require("./engine-lifecycle-event-push-relay");
let EngineLifecycleEventController = class EngineLifecycleEventController {
    constructor(pushRelay) {
        this.pushRelay = pushRelay;
    }
    async receiveLifecycleEvents(req, res) {
        const parsed = engine_1.lifecycleEventBatchSchema.safeParse(req.body);
        if (!parsed.success)
            throw new errors_1.BadRequestError('Invalid lifecycle event batch');
        this.pushRelay.relay(parsed.data.events);
        res.status(204).end();
    }
};
exports.EngineLifecycleEventController = EngineLifecycleEventController;
exports.EngineLifecycleEventController = EngineLifecycleEventController = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [engine_lifecycle_event_push_relay_1.EngineLifecycleEventPushRelay])
], EngineLifecycleEventController);
//# sourceMappingURL=engine-lifecycle-event.controller.js.map