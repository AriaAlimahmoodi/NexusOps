"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pairDataTableColumns = pairDataTableColumns;
exports.orderColumnRenames = orderColumnRenames;
function pairDataTableColumns(source, target) {
    const unpaired = new Set(source);
    const take = (matches) => {
        const match = [...unpaired].find(matches);
        if (match)
            unpaired.delete(match);
        return match;
    };
    const pairedById = new Map(target.map((column) => [column, take(({ id }) => id !== undefined && id === column.id)]));
    const pairs = [];
    const removed = [];
    for (const column of target) {
        const match = pairedById.get(column) ?? take(({ name }) => name === column.name);
        if (match)
            pairs.push({ source: match, target: column });
        else
            removed.push(column);
    }
    return { pairs, added: source.filter((column) => unpaired.has(column)), removed };
}
function orderColumnRenames(pairs) {
    const keptPairs = pairs.filter(({ source, target }) => source.type === target.type);
    const liveNameCounts = new Map();
    const countName = (name, delta) => liveNameCounts.set(name.toLowerCase(), (liveNameCounts.get(name.toLowerCase()) ?? 0) + delta);
    for (const { target } of keptPairs)
        countName(target.name, 1);
    const ordered = [];
    let pending = keptPairs.filter(({ source, target }) => source.name !== target.name);
    while (pending.length > 0) {
        const next = pending.find(({ source, target }) => {
            const newName = source.name.toLowerCase();
            const ownCount = newName === target.name.toLowerCase() ? 1 : 0;
            return (liveNameCounts.get(newName) ?? 0) === ownCount;
        });
        if (!next)
            break;
        ordered.push(next);
        countName(next.target.name, -1);
        countName(next.source.name, 1);
        pending = pending.filter((pair) => pair !== next);
    }
    return { ordered, blocked: pending };
}
//# sourceMappingURL=pair-columns.js.map