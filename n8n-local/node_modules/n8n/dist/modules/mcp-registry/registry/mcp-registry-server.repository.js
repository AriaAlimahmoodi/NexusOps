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
exports.McpRegistryServerRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const mcp_registry_server_entity_1 = require("./mcp-registry-server.entity");
const OVERWRITTEN_COLUMNS = ['status', 'version', 'registryUpdatedAt', 'data', 'updatedAt'];
let McpRegistryServerRepository = class McpRegistryServerRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(mcp_registry_server_entity_1.McpRegistryServerEntity, dataSource.manager);
    }
    async readDbNow() {
        const isPostgres = this.manager.connection.options.type === 'postgres';
        const [row] = await this.query(`SELECT ${(0, db_1.dbNowLiteral)(isPostgres)} AS "dbNow"`);
        return (0, db_1.parseDbTime)(row.dbNow);
    }
    async upsertFetchedServers(rows, fetchedAt) {
        if (rows.length > 0) {
            const escape = (column) => this.manager.connection.driver.escape(column);
            const overwrite = OVERWRITTEN_COLUMNS.map((column) => `${escape(column)} = EXCLUDED.${escape(column)}`).join(', ');
            const values = [...rows]
                .sort((a, b) => (a.slug < b.slug ? -1 : 1))
                .map((row) => ({ ...row, updatedAt: fetchedAt }));
            const storedUpdatedAt = `${escape(this.metadata.tableName)}.${escape('updatedAt')}`;
            await this.createQueryBuilder(this.metadata.tablePath)
                .insert()
                .values(values)
                .onConflict(`(${escape('slug')}) DO UPDATE SET ${overwrite} WHERE ${storedUpdatedAt} < EXCLUDED.${escape('updatedAt')}`)
                .execute();
        }
    }
};
exports.McpRegistryServerRepository = McpRegistryServerRepository;
exports.McpRegistryServerRepository = McpRegistryServerRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], McpRegistryServerRepository);
//# sourceMappingURL=mcp-registry-server.repository.js.map