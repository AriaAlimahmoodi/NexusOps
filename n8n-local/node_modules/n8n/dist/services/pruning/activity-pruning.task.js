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
exports.ActivityPruningTask = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const sweepIntervalSeconds = 1 * constants_1.Time.hours.toSeconds;
let ActivityPruningTask = class ActivityPruningTask {
    constructor(logger, activityEventRepository, activityLogConfig) {
        this.logger = logger;
        this.activityEventRepository = activityEventRepository;
        this.activityLogConfig = activityLogConfig;
        this.name = 'activity-pruning';
        this.schedule = (0, decorators_1.intervalFromSeconds)(sweepIntervalSeconds);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: {
                retryOnFailure: true,
            },
            leaderTimer: {
                runOnTakeover: true,
            },
        });
        this.logger = this.logger.scoped('activity-log');
    }
    async run(signal) {
        const { retentionDays, maxEntries } = this.activityLogConfig;
        let deleted = 0;
        if (retentionDays > 0) {
            const cutoff = new Date(Date.now() - retentionDays * constants_1.Time.days.toMilliseconds);
            deleted += await this.activityEventRepository.deleteOlderThan(cutoff, signal);
        }
        if (!signal.aborted && maxEntries > 0) {
            deleted += await this.activityEventRepository.deleteBeyondNewest(maxEntries, signal);
        }
        if (deleted > 0)
            this.logger.debug(`Pruned ${deleted} activity entries`);
    }
};
exports.ActivityPruningTask = ActivityPruningTask;
exports.ActivityPruningTask = ActivityPruningTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ActivityEventRepository, config_1.ActivityLogConfig])
], ActivityPruningTask);
//# sourceMappingURL=activity-pruning.task.js.map