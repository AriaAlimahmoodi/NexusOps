"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineV2PushSession = exports.EngineV2StepRun = void 0;
class EngineV2StepRun {
    constructor(executionIndex, startTime) {
        this.executionIndex = executionIndex;
        this.startTime = startTime;
        this.settled = false;
    }
}
exports.EngineV2StepRun = EngineV2StepRun;
class EngineV2PushSession {
    constructor(pushRef, workflowId, trigger) {
        this.pushRef = pushRef;
        this.workflowId = workflowId;
        this.trigger = trigger;
        this.sequenceNumber = 0;
        this.nextExecutionIndex = 0;
        this.steps = new Map();
        this.lastSeenAt = Date.now();
    }
}
exports.EngineV2PushSession = EngineV2PushSession;
//# sourceMappingURL=engine-v2-push-session.js.map