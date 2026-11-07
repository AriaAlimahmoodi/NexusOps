"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextBatch = nextBatch;
function nextBatch(sib) {
    return 'sibNode' in sib ? sib.sibNode : sib;
}
//# sourceMappingURL=next-batch.js.map