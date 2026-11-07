"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemoryLimit = getMemoryLimit;
exports.parseCpuMax = parseCpuMax;
exports.parseCfs = parseCfs;
exports.getCpuLimit = getCpuLimit;
const node_fs_1 = require("node:fs");
function getMemoryLimit() {
    const limit = process.constrainedMemory();
    return limit > 0 && limit < Number.MAX_SAFE_INTEGER ? limit : null;
}
function parseCpuMax(content) {
    const [quota, period] = content.trim().split(/\s+/);
    return toCpus(quota, period);
}
function parseCfs(quota, period) {
    return toCpus(quota.trim(), period.trim());
}
function toCpus(quota, period) {
    const q = Number(quota);
    const p = Number(period);
    if (!quota || quota === 'max' || !Number.isFinite(q) || q <= 0 || !Number.isFinite(p) || p <= 0) {
        return null;
    }
    return q / p;
}
function getCpuLimit() {
    const cpuMax = readFile('/sys/fs/cgroup/cpu.max');
    if (cpuMax !== null && /^(max|\d+) \d+$/.test(cpuMax)) {
        return {
            limit: parseCpuMax(cpuMax),
            source: 'cgroup_v2',
            weight: readPositiveInt('/sys/fs/cgroup/cpu.weight'),
        };
    }
    const quota = readFile('/sys/fs/cgroup/cpu/cpu.cfs_quota_us');
    const period = readFile('/sys/fs/cgroup/cpu/cpu.cfs_period_us');
    if (quota !== null && period !== null && /^-?\d+$/.test(quota) && /^\d+$/.test(period)) {
        return {
            limit: parseCfs(quota, period),
            source: 'cgroup_v1',
            weight: readPositiveInt('/sys/fs/cgroup/cpu/cpu.shares'),
        };
    }
    return { limit: null, source: 'unreadable', weight: null };
}
function readFile(path) {
    try {
        return (0, node_fs_1.readFileSync)(path, 'utf8').trim();
    }
    catch {
        return null;
    }
}
function readPositiveInt(path) {
    const value = Number(readFile(path));
    return Number.isInteger(value) && value > 0 ? value : null;
}
//# sourceMappingURL=container-limits.js.map