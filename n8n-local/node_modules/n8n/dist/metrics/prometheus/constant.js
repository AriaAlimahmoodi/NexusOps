"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIZE_BUCKETS_BYTES = exports.LAG_BUCKETS_SECONDS = exports.DURATION_BUCKETS_SECONDS = exports.METRICS_PATH = void 0;
exports.METRICS_PATH = '/metrics';
exports.DURATION_BUCKETS_SECONDS = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60, 120, 300, 600,
];
exports.LAG_BUCKETS_SECONDS = [
    0.01, 0.1, 1, 5, 10, 30, 60, 300, 600, 1800, 3600, 21600, 86400,
];
exports.SIZE_BUCKETS_BYTES = [
    1_024,
    10_240,
    102_400,
    1_048_576,
    10_485_760,
    52_428_800,
    104_857_600,
    524_288_000,
    1_073_741_824,
];
//# sourceMappingURL=constant.js.map