"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHandlebarsEngine = createHandlebarsEngine;
const express_handlebars_1 = require("express-handlebars");
function createHandlebarsEngine() {
    return (0, express_handlebars_1.engine)({
        defaultLayout: false,
        helpers: {
            eq: (a, b) => a === b,
            includes: (arr, val) => {
                if (Array.isArray(arr)) {
                    return arr.includes(val);
                }
                if (typeof arr === 'string' && typeof val === 'string') {
                    if (arr === val) {
                        return true;
                    }
                    return arr
                        .split(',')
                        .map((s) => s.trim())
                        .includes(val);
                }
                return false;
            },
        },
    });
}
//# sourceMappingURL=handlebars.util.js.map