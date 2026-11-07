"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENERAL_CAPABILITY = exports.CASE_INPUT_FLAVORS = exports.CASE_DIFFICULTIES = void 0;
exports.sampleDimensionTuples = sampleDimensionTuples;
exports.CASE_DIFFICULTIES = ['simple', 'multi_step'];
exports.CASE_INPUT_FLAVORS = [
    'happy_path',
    'underspecified',
    'out_of_scope',
    'adversarial',
];
exports.GENERAL_CAPABILITY = 'general';
function sampleDimensionTuples(capabilities, count) {
    if (count <= 0)
        return [];
    const caps = capabilities.length > 0 ? capabilities : [exports.GENERAL_CAPABILITY];
    const nCaps = caps.length;
    const nDiff = exports.CASE_DIFFICULTIES.length;
    const nFlavors = exports.CASE_INPUT_FLAVORS.length;
    const gridSize = nCaps * nDiff * nFlavors;
    const key = (c, d, f) => `${c}:${d}:${f}`;
    const seen = new Set();
    const tuples = [];
    for (let i = 0; i < count; i++) {
        if (tuples.length >= gridSize) {
            tuples.push(tuples[i % gridSize]);
            continue;
        }
        let c = i % nCaps;
        let d = Math.floor(i / nCaps) % nDiff;
        let f = i % nFlavors;
        while (seen.has(key(c, d, f))) {
            f += 1;
            if (f === nFlavors) {
                f = 0;
                d += 1;
            }
            if (d === nDiff) {
                d = 0;
                c += 1;
            }
            if (c === nCaps)
                c = 0;
        }
        seen.add(key(c, d, f));
        tuples.push({
            capability: caps[c],
            difficulty: exports.CASE_DIFFICULTIES[d],
            flavor: exports.CASE_INPUT_FLAVORS[f],
        });
    }
    return tuples;
}
//# sourceMappingURL=dimensions.js.map