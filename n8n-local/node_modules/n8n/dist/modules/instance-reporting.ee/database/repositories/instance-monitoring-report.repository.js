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
exports.InstanceMonitoringReportRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const uuid_1 = require("uuid");
const instance_monitoring_report_1 = require("../entities/instance-monitoring-report");
let InstanceMonitoringReportRepository = class InstanceMonitoringReportRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(instance_monitoring_report_1.InstanceMonitoringReport, dataSource.manager);
    }
    async findPending() {
        const [latest] = await this.find({ order: { createdAt: 'DESC', id: 'DESC' }, take: 1 });
        return latest?.status === 'pending' || latest?.status === 'sending' ? latest : null;
    }
    async readDbNow() {
        const isPostgres = this.manager.connection.options.type === 'postgres';
        const [row] = await this.query(`SELECT ${(0, db_1.dbNowLiteral)(isPostgres)} AS "dbNow"`);
        return (0, db_1.parseDbTime)(row.dbNow);
    }
    async claimForSend(id) {
        const startedAt = await this.readDbNow();
        const result = await this.update({ id, status: 'pending' }, { status: 'sending', lastAttemptAt: startedAt });
        return result.affected === 1 ? startedAt : null;
    }
    async releaseStaleSend(id, startedAt) {
        const result = await this.update({ id, status: 'sending', lastAttemptAt: startedAt ?? (0, typeorm_1.IsNull)() }, { status: 'pending' });
        return result.affected === 1;
    }
    async hasSettledToday(now) {
        return await this.existsBy({
            reportDate: utcDay(now),
            status: (0, typeorm_1.In)(['delivered', 'skipped_after_max_retries']),
        });
    }
    async createPending(dataPoints, now) {
        try {
            return await this.save(this.create({
                id: (0, uuid_1.v4)(),
                reportDate: utcDay(now),
                dataPoints,
                status: 'pending',
                deliveredAt: null,
            }));
        }
        catch (error) {
            if ((0, db_1.isUniqueConstraintError)(error))
                return null;
            throw error;
        }
    }
    async findLastCoveredDay() {
        const delivered = await this.find({ where: { status: 'delivered' }, select: ['dataPoints'] });
        const days = delivered.flatMap((report) => report.dataPoints.flatMap((point) => (point.kind === 'daily' ? [point.date] : [])));
        return days.length ? days.reduce((a, b) => (a > b ? a : b)) : null;
    }
    async findLastDeliveryTime() {
        const report = await this.findOne({
            where: { status: 'delivered', deliveredAt: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) },
            order: { deliveredAt: 'DESC' },
            select: ['deliveredAt'],
        });
        return report?.deliveredAt ?? null;
    }
    async markDelivered(id, deliveredAt) {
        const result = await this.update({ id, status: (0, typeorm_1.Not)('delivered') }, {
            attempts: () => 'attempts + 1',
            status: 'delivered',
            deliveredAt,
            lastAttemptAt: deliveredAt,
            lastError: null,
        });
        return result.affected === 1;
    }
    async recordFailure(id, claimedAt, error, failedAt) {
        const result = await this.update({ id, status: 'sending', lastAttemptAt: claimedAt }, {
            attempts: () => 'attempts + 1',
            status: 'pending',
            lastAttemptAt: failedAt,
            lastError: error,
        });
        return result.affected === 1;
    }
    async markSkipped(id) {
        const result = await this.update({ id, status: 'pending' }, { status: 'skipped_after_max_retries' });
        return result.affected === 1;
    }
};
exports.InstanceMonitoringReportRepository = InstanceMonitoringReportRepository;
exports.InstanceMonitoringReportRepository = InstanceMonitoringReportRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], InstanceMonitoringReportRepository);
function utcDay(instant) {
    return instant.toISOString().slice(0, 10);
}
//# sourceMappingURL=instance-monitoring-report.repository.js.map