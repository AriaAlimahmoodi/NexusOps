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
exports.InstanceAiResourceRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const instance_ai_resource_entity_1 = require("../entities/instance-ai-resource.entity");
let InstanceAiResourceRepository = class InstanceAiResourceRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(instance_ai_resource_entity_1.InstanceAiResource, dataSource.manager);
    }
};
exports.InstanceAiResourceRepository = InstanceAiResourceRepository;
exports.InstanceAiResourceRepository = InstanceAiResourceRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], InstanceAiResourceRepository);
//# sourceMappingURL=instance-ai-resource.repository.js.map