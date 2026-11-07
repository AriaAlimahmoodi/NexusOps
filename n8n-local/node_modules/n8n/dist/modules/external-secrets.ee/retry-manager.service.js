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
exports.ExternalSecretsRetryManager = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const constants_1 = require("./constants");
let ExternalSecretsRetryManager = class ExternalSecretsRetryManager {
    constructor(logger) {
        this.retries = new Map();
        const scopedLogger = logger.scoped('external-secrets');
        const withPrefix = (level) => (message, metadata) => scopedLogger[level](`External secrets: ${message}`, metadata);
        this.logger = {
            debug: withPrefix('debug'),
            error: withPrefix('error'),
            warn: withPrefix('warn'),
            info: withPrefix('info'),
        };
    }
    async runWithRetry(key, operation) {
        this.cancelRetry(key);
        const result = await operation();
        if (result.success) {
            return result;
        }
        this.logger.error(`Operation failed for ${key}`, { error: result.error });
        this.scheduleRetry(key, operation);
        return { success: false, error: result.error };
    }
    scheduleRetry(key, operation, currentBackoff = constants_1.EXTERNAL_SECRETS_INITIAL_BACKOFF, attempt = 0) {
        const nextBackoff = Math.min(currentBackoff * 2, constants_1.EXTERNAL_SECRETS_MAX_BACKOFF);
        const delay = Math.round(currentBackoff * (0.5 + Math.random() / 2));
        const timeout = setTimeout(async () => {
            this.logger.debug(`Retrying operation for ${key} (attempt ${attempt + 1})`);
            this.retries.delete(key);
            let result;
            try {
                result = await operation();
            }
            catch (error) {
                this.logger.warn(`Stopped retrying ${key}`, { error: (0, ensure_error_1.ensureError)(error) });
                return;
            }
            if (result.success) {
                this.logger.debug(`Operation for ${key} succeeded on retry attempt ${attempt + 1}`);
                return;
            }
            this.logger.error(`Retry failed for ${key}`, { error: result.error });
            this.scheduleRetry(key, operation, nextBackoff, attempt + 1);
        }, delay);
        this.retries.set(key, {
            timeout,
            operation,
            attempt: attempt + 1,
            nextBackoff,
        });
        this.logger.debug(`Scheduled retry for ${key} in ${delay}ms (attempt ${attempt + 1})`);
    }
    cancelRetry(key) {
        const retryInfo = this.retries.get(key);
        if (!retryInfo) {
            return false;
        }
        clearTimeout(retryInfo.timeout);
        this.retries.delete(key);
        this.logger.debug(`Cancelled retry for ${key}`);
        return true;
    }
    cancelAll() {
        for (const [key, retryInfo] of this.retries.entries()) {
            clearTimeout(retryInfo.timeout);
            this.logger.debug(`Cancelled retry for ${key}`);
        }
        this.retries.clear();
    }
    isRetrying(key) {
        return this.retries.has(key);
    }
    getRetryInfo(key) {
        const retryInfo = this.retries.get(key);
        if (!retryInfo) {
            return undefined;
        }
        return {
            attempt: retryInfo.attempt,
            nextBackoff: retryInfo.nextBackoff,
        };
    }
};
exports.ExternalSecretsRetryManager = ExternalSecretsRetryManager;
exports.ExternalSecretsRetryManager = ExternalSecretsRetryManager = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger])
], ExternalSecretsRetryManager);
//# sourceMappingURL=retry-manager.service.js.map