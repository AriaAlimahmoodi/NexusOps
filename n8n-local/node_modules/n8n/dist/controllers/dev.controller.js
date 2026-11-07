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
exports.DevController = void 0;
const decorators_1 = require("@n8n/decorators");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
let DevController = class DevController {
    constructor(loadNodesAndCredentials) {
        this.loadNodesAndCredentials = loadNodesAndCredentials;
    }
    async reload() {
        const reloaded = await this.loadNodesAndCredentials.reloadCustomNodes();
        return { reloaded };
    }
};
exports.DevController = DevController;
__decorate([
    (0, decorators_1.Post)('/reload', { skipAuth: true, ipRateLimit: { limit: 100, windowMs: 60_000 } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DevController.prototype, "reload", null);
exports.DevController = DevController = __decorate([
    (0, decorators_1.RestController)('/dev'),
    __metadata("design:paramtypes", [load_nodes_and_credentials_1.LoadNodesAndCredentials])
], DevController);
//# sourceMappingURL=dev.controller.js.map