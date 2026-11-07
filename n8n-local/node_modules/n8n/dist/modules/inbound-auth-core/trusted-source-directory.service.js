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
exports.TrustedSourceDbDirectory = void 0;
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
let TrustedSourceDbDirectory = class TrustedSourceDbDirectory {
    constructor(store) {
        this.store = store;
    }
    async listTrustedSources({ surface, capability, }) {
        const sources = await this.store.listBySurface(surface);
        return sources
            .filter((source) => capability === undefined ||
            (0, inbound_auth_1.deriveCapabilities)(source.config, source.metadata).has(capability))
            .map(({ id, name }) => ({ id, name }));
    }
};
exports.TrustedSourceDbDirectory = TrustedSourceDbDirectory;
exports.TrustedSourceDbDirectory = TrustedSourceDbDirectory = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [inbound_auth_1.TrustedSourceStore])
], TrustedSourceDbDirectory);
//# sourceMappingURL=trusted-source-directory.service.js.map