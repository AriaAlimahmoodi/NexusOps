"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowPublicationOutboxWorkerPool = void 0;
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
class WorkflowPublicationOutboxWorkerPool {
    constructor(options) {
        this.options = options;
        this.activeWorkers = new Set();
        this.wakeRequested = false;
    }
    topUp() {
        if (!this.options.shouldRun())
            return;
        const { concurrency } = this.options;
        if (this.activeWorkers.size >= concurrency) {
            this.wakeRequested = true;
            return;
        }
        while (this.activeWorkers.size < concurrency)
            this.spawnWorker();
    }
    async awaitIdle() {
        let error = null;
        while (this.activeWorkers.size > 0) {
            const outcomes = await Promise.all([...this.activeWorkers]);
            error ??= outcomes.find((outcome) => outcome !== null) ?? null;
        }
        return error;
    }
    spawnWorker() {
        const worker = this.options
            .runPass()
            .then(() => null, (error) => {
            const failure = (0, ensure_error_1.ensureError)(error);
            this.options.onWorkerError(failure);
            return failure;
        })
            .finally(() => {
            this.activeWorkers.delete(worker);
            if (this.wakeRequested) {
                this.wakeRequested = false;
                if (this.options.shouldRun())
                    this.spawnWorker();
            }
        });
        this.activeWorkers.add(worker);
    }
}
exports.WorkflowPublicationOutboxWorkerPool = WorkflowPublicationOutboxWorkerPool;
//# sourceMappingURL=workflow-publication-outbox-worker-pool.js.map