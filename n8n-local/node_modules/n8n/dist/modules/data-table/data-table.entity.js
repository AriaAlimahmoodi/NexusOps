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
exports.DataTable = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const data_table_column_entity_1 = require("./data-table-column.entity");
let DataTable = class DataTable extends db_1.WithTimestampsAndStringId {
    constructor() {
        super();
    }
};
exports.DataTable = DataTable;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DataTable.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => data_table_column_entity_1.DataTableColumn, (dataTableColumn) => dataTableColumn.dataTable, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], DataTable.prototype, "columns", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => db_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'projectId' }),
    __metadata("design:type", db_1.Project)
], DataTable.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DataTable.prototype, "projectId", void 0);
exports.DataTable = DataTable = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)(['name', 'projectId'], { unique: true }),
    __metadata("design:paramtypes", [])
], DataTable);
//# sourceMappingURL=data-table.entity.js.map