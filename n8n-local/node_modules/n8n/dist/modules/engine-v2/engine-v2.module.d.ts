import type { ModuleInterface } from '@n8n/decorators';
export declare class EngineV2Module implements ModuleInterface {
    private responseSender?;
    private responseReceiver?;
    init(): Promise<void>;
    private initInMemoryResponseChannel;
    shutdown(): Promise<void>;
}
