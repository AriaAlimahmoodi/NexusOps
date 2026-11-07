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
exports.DataTableColumn = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let DataTableColumn = class DataTableColumn extends db_1.WithTimestampsAndStringId {
};
exports.DataTableColumn = DataTableColumn;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DataTableColumn.prototype, "dataTableId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DataTableColumn.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], DataTableColumn.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], DataTableColumn.prototype, "index", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('DataTable', 'columns'),
    (0, typeorm_1.JoinColumn)({ name: 'dataTableId' }),
    __metadata("design:type", Function)
], DataTableColumn.prototype, "dataTable", void 0);
exports.DataTableColumn = DataTableColumn = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)(['dataTableId', 'name'], { unique: true })
], DataTableColumn);
//# sourceMappingURL=data-table-column.entity.js.map