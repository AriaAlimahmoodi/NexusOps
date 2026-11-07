"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowPublicationLifecycleLock = void 0;
const di_1 = require("@n8n/di");
let WorkflowPublicationLifecycleLock = class WorkflowPublicationLifecycleLock {
    constructor() {
        this.stateByWorkflowId = new Map();
    }
    isLocked(workflowId) {
        return this.stateByWorkflowId.has(workflowId);
    }
    async runExclusive({ workflowId, fn, signal }) {
        await this.acquire(workflowId, signal);
        try {
            return await fn();
        }
        finally {
            this.release(workflowId);
        }
    }
    getOrCreateState(workflowId) {
        let state = this.stateByWorkflowId.get(workflowId);
        if (!state) {
            state = { locked: false, waiters: [] };
            this.stateByWorkflowId.set(workflowId, state);
        }
        return state;
    }
    async acquire(workflowId, signal) {
        signal.throwIfAborted();
        const state = this.getOrCreateState(workflowId);
        if (!state.locked) {
            state.locked = true;
            return;
        }
        await new Promise((resolve, reject) => {
            const waiter = () => {
                signal.removeEventListener('abort', onAbort);
                resolve();
            };
            const onAbort = () => {
                const index = state.waiters.indexOf(waiter);
                if (index !== -1)
                    state.waiters.splice(index, 1);
                reject(signal.reason);
            };
            state.waiters.push(waiter);
            signal.addEventListener('abort', onAbort, { once: true });
        });
    }
    release(workflowId) {
        const state = this.stateByWorkflowId.get(workflowId);
        if (!state)
            return;
        const next = state.waiters.shift();
        if (next) {
            next();
        }
        else {
            this.stateByWorkflowId.delete(workflowId);
        }
    }
};
exports.WorkflowPublicationLifecycleLock = WorkflowPublicationLifecycleLock;
exports.WorkflowPublicationLifecycleLock = WorkflowPublicationLifecycleLock = __decorate([
    (0, di_1.Service)()
], WorkflowPublicationLifecycleLock);
//# sourceMappingURL=workflow-publication-lifecycle-lock.js.map