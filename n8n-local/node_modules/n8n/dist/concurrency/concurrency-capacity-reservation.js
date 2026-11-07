"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrencyCapacityReservation = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
class ConcurrencyCapacityReservation {
    constructor(concurrencyControlService) {
        this.concurrencyControlService = concurrencyControlService;
        this.acquiredReservation = undefined;
    }
    async reserve(capacityFor) {
        (0, node_assert_1.default)(!this.acquiredReservation, 'Capacity already reserved');
        await this.concurrencyControlService.throttle(capacityFor);
        this.acquiredReservation = capacityFor;
    }
    release() {
        if (!this.acquiredReservation)
            return;
        this.concurrencyControlService.release({ mode: this.acquiredReservation.mode });
        this.acquiredReservation = undefined;
    }
}
exports.ConcurrencyCapacityReservation = ConcurrencyCapacityReservation;
//# sourceMappingURL=concurrency-capacity-reservation.js.map