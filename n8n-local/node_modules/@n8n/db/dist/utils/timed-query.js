"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimedQuery = void 0;
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
exports.TimedQuery = (0, decorators_1.Timed)(di_1.Container.get(backend_common_1.Logger), 'Slow database query');
//# sourceMappingURL=timed-query.js.map