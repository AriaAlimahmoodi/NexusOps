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
exports.DataTableAggregateController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const data_table_aggregate_service_1 = require("./data-table-aggregate.service");
const data_table_service_1 = require("./data-table.service");
let DataTableAggregateController = class DataTableAggregateController {
    constructor(dataTableAggregateService, dataTableService) {
        this.dataTableAggregateService = dataTableAggregateService;
        this.dataTableService = dataTableService;
    }
    async listDataTables(req, _res, payload) {
        return await this.dataTableAggregateService.getManyAndCount(req.user, payload);
    }
    async getDataTablesSize(req) {
        return await this.dataTableService.getDataTablesSize(req.user);
    }
};
exports.DataTableAggregateController = DataTableAggregateController;
__decorate([
    (0, decorators_1.Get)('/'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response, api_types_1.ListDataTableQueryDto]),
    __metadata("design:returntype", Promise)
], DataTableAggregateController.prototype, "listDataTables", null);
__decorate([
    (0, decorators_1.Get)('/limits'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataTableAggregateController.prototype, "getDataTablesSize", null);
exports.DataTableAggregateController = DataTableAggregateController = __decorate([
    (0, decorators_1.RestController)('/data-tables-global'),
    __metadata("design:paramtypes", [data_table_aggregate_service_1.DataTableAggregateService, data_table_service_1.DataTableService])
], DataTableAggregateController);
//# sourceMappingURL=data-table-aggregate.controller.js.map