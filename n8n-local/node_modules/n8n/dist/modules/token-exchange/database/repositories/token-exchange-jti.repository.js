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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenExchangeJtiRepository = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const node_assert_1 = __importDefault(require("node:assert"));
const token_exchange_jti_entity_1 = require("../entities/token-exchange-jti.entity");
let TokenExchangeJtiRepository = class TokenExchangeJtiRepository extends typeorm_1.Repository {
    constructor(dataSource, globalConfig) {
        super(token_exchange_jti_entity_1.TokenExchangeJti, dataSource.manager);
        this.dbType = globalConfig.database.type;
        const { schema, tableName } = this.metadata;
        const esc = (name) => dataSource.driver.escape(name);
        this.escapedTableName = schema ? `${esc(schema)}.${esc(tableName)}` : esc(tableName);
    }
    async atomicConsume(jti, expiresAt) {
        const esc = (name) => this.manager.connection.driver.escape(name);
        const tableName = this.escapedTableName;
        if (this.dbType === 'postgresdb') {
            const [row] = (await this.query(`WITH ins AS (
					INSERT INTO ${tableName} (${esc('jti')}, ${esc('expiresAt')}, ${esc('createdAt')})
					VALUES ($1, $2, NOW())
					ON CONFLICT (${esc('jti')}) DO NOTHING
					RETURNING ${esc('jti')}
				)
				SELECT EXISTS (SELECT 1 FROM ins) AS inserted`, [jti, expiresAt]));
            return row.inserted;
        }
        else if (this.dbType === 'sqlite') {
            const qr = this.manager.connection.createQueryRunner();
            await qr.startTransaction();
            try {
                await qr.query(`INSERT OR IGNORE INTO ${tableName} (${esc('jti')}, ${esc('expiresAt')}, ${esc('createdAt')}) VALUES (?, datetime(?), datetime('now'))`, [jti, expiresAt.toISOString()]);
                const [{ cnt }] = (await qr.query('SELECT changes() as cnt'));
                await qr.commitTransaction();
                return cnt > 0;
            }
            catch (e) {
                await qr.rollbackTransaction();
                throw e;
            }
            finally {
                await qr.release();
            }
        }
        node_assert_1.default.fail('Unknown database type');
    }
    async deleteExpiredBatch(batchSize) {
        const esc = (name) => this.manager.connection.driver.escape(name);
        const tableName = this.escapedTableName;
        if (this.dbType === 'postgresdb') {
            const [row] = (await this.query(`WITH deleted AS (
					DELETE FROM ${tableName}
					WHERE ${esc('jti')} IN (
						SELECT ${esc('jti')} FROM ${tableName}
						WHERE ${esc('expiresAt')} < NOW()
						LIMIT $1
						FOR UPDATE SKIP LOCKED
					)
					RETURNING ${esc('jti')}
				)
				SELECT COUNT(*) AS ${esc('count')} FROM deleted`, [batchSize]));
            return Number(row.count);
        }
        else if (this.dbType === 'sqlite') {
            const qr = this.manager.connection.createQueryRunner();
            await qr.startTransaction();
            try {
                await qr.query(`DELETE FROM ${tableName} WHERE ${esc('jti')} IN (
						SELECT ${esc('jti')} FROM ${tableName}
						WHERE ${esc('expiresAt')} < datetime('now')
						LIMIT ?
					)`, [batchSize]);
                const [{ cnt }] = (await qr.query('SELECT changes() as cnt'));
                await qr.commitTransaction();
                return Number(cnt);
            }
            catch (e) {
                await qr.rollbackTransaction();
                throw e;
            }
            finally {
                await qr.release();
            }
        }
        node_assert_1.default.fail('Unknown database type');
    }
};
exports.TokenExchangeJtiRepository = TokenExchangeJtiRepository;
exports.TokenExchangeJtiRepository = TokenExchangeJtiRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, config_1.GlobalConfig])
], TokenExchangeJtiRepository);
//# sourceMappingURL=token-exchange-jti.repository.js.map