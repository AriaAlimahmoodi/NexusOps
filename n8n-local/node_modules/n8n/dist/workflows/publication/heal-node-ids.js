"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healNodeIds = healNodeIds;
const uuid_1 = require("uuid");
function healNodeIds(nodes, { isTriggerLike }) {
    const report = { filled: [], reassigned: [], dropped: [] };
    const byId = new Map();
    nodes.forEach((node, index) => {
        const key = node.id || '';
        const group = byId.get(key);
        if (group === undefined) {
            byId.set(key, [index]);
        }
        else {
            group.push(index);
        }
    });
    const dropped = new Set();
    const newIds = new Map();
    for (const [id, group] of byId) {
        if (group.length < 2)
            continue;
        const lastByName = new Map();
        for (const index of group)
            lastByName.set(nodes[index].name, index);
        for (const index of group) {
            if (lastByName.get(nodes[index].name) !== index) {
                dropped.add(index);
                report.dropped.push({ name: nodes[index].name, id });
            }
        }
        if (id === '')
            continue;
        const sharers = group.filter((index) => !dropped.has(index));
        if (sharers.length < 2)
            continue;
        const triggerLike = sharers.filter((index) => isTriggerLike(nodes[index]));
        const keeper = triggerLike.length === 1 ? triggerLike[0] : sharers[0];
        for (const index of sharers) {
            if (index === keeper)
                continue;
            const newId = (0, uuid_1.v4)();
            newIds.set(index, newId);
            report.reassigned.push({ name: nodes[index].name, oldId: id, newId });
        }
    }
    nodes.forEach((node, index) => {
        if (!node.id && !dropped.has(index)) {
            const newId = (0, uuid_1.v4)();
            newIds.set(index, newId);
            report.filled.push({ name: node.name, newId });
        }
    });
    if (dropped.size === 0 && newIds.size === 0)
        return { changed: false };
    const healed = [];
    nodes.forEach((node, index) => {
        if (dropped.has(index))
            return;
        const newId = newIds.get(index);
        healed.push(newId === undefined ? node : { ...node, id: newId });
    });
    return { changed: true, nodes: healed, report };
}
//# sourceMappingURL=heal-node-ids.js.map