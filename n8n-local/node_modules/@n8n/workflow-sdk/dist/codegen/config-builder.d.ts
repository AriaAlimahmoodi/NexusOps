export interface ConfigEntry {
    condition: boolean;
    key: string;
    value: string;
}
export declare function buildConfigString(entries: ConfigEntry[]): string;
export declare function buildConfigStringMultiline(entries: ConfigEntry[], indent?: string): string;
