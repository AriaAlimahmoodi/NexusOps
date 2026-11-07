import type { OperationContext } from '@n8n/db';
type DeactivationHook = (userId: string, ctx: OperationContext) => Promise<void>;
export declare class UserDeactivationHooks {
    private readonly hooks;
    register(name: string, hook: DeactivationHook): void;
    run(userId: string, ctx: OperationContext): Promise<void>;
}
export {};
