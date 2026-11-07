"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobReturnedToQueueError = void 0;
const errors_1 = require("@n8n/errors");
class JobReturnedToQueueError extends errors_1.OperationalError {
    constructor(jobId) {
        super(`Job ${jobId} was returned to the queue because the worker is stopping`);
        this.jobId = jobId;
    }
}
exports.JobReturnedToQueueError = JobReturnedToQueueError;
//# sourceMappingURL=job-returned-to-queue.error.js.map