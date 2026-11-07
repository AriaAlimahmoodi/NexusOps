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
exports.TelemetryBufferFlushTask = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const telemetry_1 = require("../telemetry");
let TelemetryBufferFlushTask = class TelemetryBufferFlushTask {
    constructor(telemetry) {
        this.telemetry = telemetry;
        this.name = 'telemetry-buffer-flush';
        this.schedule = (0, decorators_1.intervalFromSeconds)(6 * constants_1.Time.hours.toSeconds);
        this.target = (0, decorators_1.instanceTarget)(['main', 'worker', 'webhook']);
    }
    async run() {
        this.telemetry.flushBuffers();
    }
};
exports.TelemetryBufferFlushTask = TelemetryBufferFlushTask;
exports.TelemetryBufferFlushTask = TelemetryBufferFlushTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [telemetry_1.Telemetry])
], TelemetryBufferFlushTask);
//# sourceMappingURL=telemetry-buffer-flush.task.js.map