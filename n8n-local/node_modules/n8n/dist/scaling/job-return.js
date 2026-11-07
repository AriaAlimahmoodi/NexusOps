"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwJobBackToQueue = throwJobBackToQueue;
const job_returned_to_queue_error_1 = require("../errors/job-returned-to-queue.error");
function grantRetryAttempt(job) {
    job.opts.attempts = job.attemptsMade + 2;
}
async function moveToFrontOfPriority(job, logger) {
    try {
        const { priority } = job.opts;
        if (typeof priority !== 'number' || !(priority > 0))
            return;
        await job.queue.client.hset(job.queue.toKey(String(job.id)), 'priority', priority - 0.5);
    }
    catch (error) {
        logger.warn(`Could not move job ${job.id} to the front of its priority, so it will run after the jobs with the same priority`, { jobId: job.id, error });
    }
}
async function clearProcessedOn(job, logger) {
    try {
        await job.queue.client.hdel(job.queue.toKey(String(job.id)), 'processedOn');
    }
    catch (error) {
        logger.warn(`Could not clear the start time of job ${job.id}`, { jobId: job.id, error });
    }
}
async function throwJobBackToQueue(job, logger) {
    grantRetryAttempt(job);
    await moveToFrontOfPriority(job, logger);
    await clearProcessedOn(job, logger);
    throw new job_returned_to_queue_error_1.JobReturnedToQueueError(job.id.toString());
}
//# sourceMappingURL=job-return.js.map