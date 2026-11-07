import { OperationalError } from 'n8n-workflow';
export declare class TimeoutError extends OperationalError {
}
export declare function withTimeout<T>(work: Promise<T>, ms: number, message: string): Promise<T>;
