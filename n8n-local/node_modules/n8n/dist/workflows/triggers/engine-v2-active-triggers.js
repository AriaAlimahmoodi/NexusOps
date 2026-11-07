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
exports.EngineV2ActiveTriggers = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const engine_v2_dispatcher_service_1 = require("../../services/engine-v2-dispatcher.service");
const engine_v2_payload_files_service_1 = require("../../services/engine-v2-payload-files.service");
let EngineV2ActiveTriggers = class EngineV2ActiveTriggers {
    constructor(dispatcher, payloadFiles) {
        this.dispatcher = dispatcher;
        this.payloadFiles = payloadFiles;
    }
    handles(workflowData, mode) {
        return this.dispatcher.handlesWorkflow(workflowData, mode);
    }
    assertSupported({ responsePromise, donePromise }, slots) {
        if (responsePromise === undefined && donePromise === undefined)
            return;
        void this.payloadFiles.discard(slots);
        throw new n8n_workflow_1.UserError('Engine v2 cannot run a trigger that waits for its execution to finish yet. Set the node to hand off without waiting.');
    }
};
exports.EngineV2ActiveTriggers = EngineV2ActiveTriggers;
exports.EngineV2ActiveTriggers = EngineV2ActiveTriggers = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [engine_v2_dispatcher_service_1.EngineV2Dispatcher, engine_v2_payload_files_service_1.EngineV2PayloadFiles])
], EngineV2ActiveTriggers);
//# sourceMappingURL=engine-v2-active-triggers.js.map