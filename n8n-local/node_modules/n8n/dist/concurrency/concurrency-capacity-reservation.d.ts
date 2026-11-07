import type { CapacityTarget, ConcurrencyControlService } from '../concurrency/concurrency-control.service';
export declare class ConcurrencyCapacityReservation {
    private readonly concurrencyControlService;
    private acquiredReservation;
    constructor(concurrencyControlService: ConcurrencyControlService);
    reserve(capacityFor: CapacityTarget): Promise<void>;
    release(): void;
}
