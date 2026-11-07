"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTableSerializer = void 0;
const di_1 = require("@n8n/di");
const data_table_schema_1 = require("../../spec/serialized/data-table.schema");
const package_serialization_types_1 = require("../package-serialization.types");
const serializeDataTablePayload = (0, package_serialization_types_1.definePackageSerializationPayload)();
const serializeColumnPayload = (0, package_serialization_types_1.definePackageSerializationPayload)();
let DataTableSerializer = class DataTableSerializer {
    serialize(dataTable) {
        const columns = [...dataTable.columns]
            .sort((a, b) => a.index - b.index)
            .map((column) => serializeColumnPayload({
            id: column.id,
            name: column.name,
            type: column.type,
            index: column.index,
        }));
        return data_table_schema_1.serializedDataTableSchema.parse(serializeDataTablePayload({
            id: dataTable.id,
            name: dataTable.name,
            columns,
        }));
    }
};
exports.DataTableSerializer = DataTableSerializer;
exports.DataTableSerializer = DataTableSerializer = __decorate([
    (0, di_1.Service)()
], DataTableSerializer);
//# sourceMappingURL=data-table.serializer.js.map