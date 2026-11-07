export declare function getMemoryLimit(): number | null;
export declare function parseCpuMax(content: string): number | null;
export declare function parseCfs(quota: string, period: string): number | null;
export type CpuLimit = {
    limit: number | null;
    source: 'cgroup_v2' | 'cgroup_v1' | 'unreadable';
    weight: number | null;
};
export declare function getCpuLimit(): CpuLimit;
