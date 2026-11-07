"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = withTransaction;
async function withTransaction(manager, trx, run) {
    if (trx)
        return await run(trx);
    return await manager.transaction(run);
}
//# sourceMappingURL=transaction.js.map