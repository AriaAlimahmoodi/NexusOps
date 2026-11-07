"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionCoordinator = void 0;
const DirectExecutionStrategy_1 = require("./DirectExecutionStrategy");
const QueuedExecutionStrategy_1 = require("./QueuedExecutionStrategy");
class ExecutionCoordinator {
    constructor(strategy) {
        this.strategy = strategy ?? new DirectExecutionStrategy_1.DirectExecutionStrategy();
    }
    async executeTool(tool, args, context) {
        return await this.strategy.executeTool(tool, args, context);
    }
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    getStrategy() {
        return this.strategy;
    }
    isQueueMode() {
        return this.strategy instanceof QueuedExecutionStrategy_1.QueuedExecutionStrategy;
    }
}
exports.ExecutionCoordinator = ExecutionCoordinator;
//# sourceMappingURL=ExecutionCoordinator.js.map