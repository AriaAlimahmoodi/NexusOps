"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectExecutionStrategy = void 0;
class DirectExecutionStrategy {
    async executeTool(tool, args, _context) {
        return await tool.invoke(args);
    }
}
exports.DirectExecutionStrategy = DirectExecutionStrategy;
//# sourceMappingURL=DirectExecutionStrategy.js.map