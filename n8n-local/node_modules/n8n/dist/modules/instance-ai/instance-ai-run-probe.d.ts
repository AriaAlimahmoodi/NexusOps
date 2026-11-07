export declare class InstanceAiRunProbe {
    private activeRunCountProvider;
    registerActiveRunCountProvider(provider: () => number): void;
    activeRunCount(): number;
}
