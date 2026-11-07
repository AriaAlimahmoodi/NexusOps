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
exports.LicenseRenewalTask = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const license_sdk_1 = require("@n8n_io/license-sdk");
const license_1 = require("../license");
let LicenseRenewalTask = class LicenseRenewalTask {
    constructor(license) {
        this.license = license;
        this.name = 'license-renewal';
        this.schedule = (0, decorators_1.intervalFromMilliseconds)(license_sdk_1.AUTORENEWAL_INTERVAL);
        this.target = (0, decorators_1.clusterTarget)({
            scheduler: {
                retryOnFailure: false,
                missedAfterSeconds: 5 * constants_1.Time.minutes.toSeconds,
                catchUp: true,
            },
            leaderTimer: {
                runOnTakeover: true,
            },
        });
    }
    async run() {
        await this.license.renewIfDue();
    }
};
exports.LicenseRenewalTask = LicenseRenewalTask;
exports.LicenseRenewalTask = LicenseRenewalTask = __decorate([
    (0, decorators_1.SystemTask)(),
    __metadata("design:paramtypes", [license_1.License])
], LicenseRenewalTask);
//# sourceMappingURL=license-renewal.task.js.map