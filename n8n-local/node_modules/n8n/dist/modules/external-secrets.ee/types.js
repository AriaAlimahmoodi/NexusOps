"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsProvider = void 0;
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const external_secrets_config_1 = require("./external-secrets.config");
const with_timeout_1 = require("./with-timeout");
class SecretsProvider {
    constructor() {
        this.state = 'initializing';
        this.stateHistory = [];
    }
    async connect() {
        this.setState('connecting');
        try {
            const timeoutMs = di_1.Container.get(external_secrets_config_1.ExternalSecretsConfig).connectTimeout * constants_1.Time.seconds.toMilliseconds;
            await (0, with_timeout_1.withTimeout)(this.doConnect(), timeoutMs, `Timed out connecting after ${timeoutMs}ms`);
            this.setState('connected');
        }
        catch (error) {
            const typedError = error instanceof Error ? error : new Error(String(error));
            this.setState('error', typedError);
        }
    }
    setState(newState, error) {
        const oldState = this.state;
        if (oldState === newState)
            return;
        this.stateHistory.push({
            from: oldState,
            to: newState,
            at: new Date(),
            error,
        });
        this.state = newState;
        this.lastError = error;
    }
    get hasEverBeenConnected() {
        return this.stateHistory.some((t) => t.to === 'connected');
    }
    get canPerformOperations() {
        return this.state === 'connected';
    }
}
exports.SecretsProvider = SecretsProvider;
//# sourceMappingURL=types.js.map