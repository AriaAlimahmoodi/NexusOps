"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitBreakerOpen = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const sliding_window_1 = require("./sliding-window");
class CircuitBreakerOpen extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitBreakerOpen';
    }
}
exports.CircuitBreakerOpen = CircuitBreakerOpen;
class CircuitBreaker {
    constructor(options) {
        this.pendingHalfOpenRequests = 0;
        this.inflightRequests = 0;
        this.state = 'CLOSED';
        this.lastFailureTime = 0;
        this.halfOpenCount = 0;
        this.timeoutMs = options.timeout;
        this.maxFailures = options.maxFailures;
        this.halfOpenRequests = options.halfOpenRequests;
        this.failureWindowMs = options.failureWindow;
        this.maxConcurrentHalfOpenRequests = options.maxConcurrentHalfOpenRequests ?? 1;
        this.slidingWindow = new sliding_window_1.SlidingWindow({
            durationMs: this.failureWindowMs,
            maxEvents: this.maxFailures,
        });
        this.logger = di_1.Container.get(backend_common_1.Logger).scoped('circuit-breaker');
    }
    currentState() {
        return this.state;
    }
    getFailureCount() {
        return this.slidingWindow.getCount();
    }
    clearFailures() {
        this.slidingWindow.clear();
    }
    recordFailure() {
        const now = Date.now();
        this.lastFailureTime = now;
        this.slidingWindow.addEvent(now);
    }
    changeToState(newState) {
        if (newState === this.state)
            return;
        this.logger.debug(`Circuit breaker changing state from ${this.state} to ${newState}`);
        this.state = newState;
    }
    async handleOpenState(fn) {
        if (Date.now() - this.lastFailureTime >= this.timeoutMs) {
            this.halfOpenCount = 0;
            this.changeToState('HALF_OPEN');
            return await this.handleHalfOpenState(fn);
        }
        throw new CircuitBreakerOpen();
    }
    async handleHalfOpenState(fn) {
        if (this.pendingHalfOpenRequests >= this.maxConcurrentHalfOpenRequests) {
            throw new CircuitBreakerOpen('Circuit breaker is half-open and testing requests, this request is rejected');
        }
        this.pendingHalfOpenRequests++;
        try {
            const result = await fn();
            this.halfOpenCount++;
            if (this.halfOpenCount >= this.halfOpenRequests) {
                this.changeToState('CLOSED');
                this.clearFailures();
            }
            return result;
        }
        catch (error) {
            this.recordFailure();
            this.changeToState('OPEN');
            throw error;
        }
        finally {
            this.pendingHalfOpenRequests--;
        }
    }
    async handleClosedState(fn) {
        try {
            return await fn();
        }
        catch (error) {
            this.recordFailure();
            if (this.getFailureCount() >= this.maxFailures) {
                this.changeToState('OPEN');
            }
            throw error;
        }
    }
    async execute(fn) {
        const wrapper = async () => {
            this.inflightRequests++;
            this.logger.debug(`Executing function with circuit breaker protection, inflight requests: ${this.inflightRequests}`);
            try {
                return await fn();
            }
            finally {
                this.inflightRequests--;
                this.logger.debug(`Executed function with circuit breaker protection, inflight requests: ${this.inflightRequests}`);
            }
        };
        switch (this.state) {
            case 'OPEN':
                return await this.handleOpenState(wrapper);
            case 'HALF_OPEN':
                return await this.handleHalfOpenState(wrapper);
            case 'CLOSED':
                return await this.handleClosedState(wrapper);
        }
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuit-breaker.js.map