"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discardBlankFileInputs = void 0;
const promises_1 = require("node:fs/promises");
const isBlankFileInput = (file) => file.originalFilename === '' && file.size === 0;
const discardBlankFileInputs = async (files) => {
    const filled = {};
    const discarded = [];
    for (const [key, entries] of Object.entries(files)) {
        if (!entries)
            continue;
        const keptEntries = [];
        for (const file of entries) {
            if (isBlankFileInput(file))
                discarded.push(file);
            else
                keptEntries.push(file);
        }
        if (keptEntries.length > 0)
            filled[key] = keptEntries;
    }
    await Promise.all(discarded.map(async (file) => {
        try {
            await (0, promises_1.rm)(file.filepath, { force: true });
        }
        catch {
        }
    }));
    return filled;
};
exports.discardBlankFileInputs = discardBlankFileInputs;
//# sourceMappingURL=webhook-blank-file-inputs.js.map