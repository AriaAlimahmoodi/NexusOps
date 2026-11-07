"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createE2EDiagnosticsRouter = createE2EDiagnosticsRouter;
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const express_1 = require("express");
const promises_1 = require("node:stream/promises");
const ResponseHelper = __importStar(require("../response-helper"));
const heap_diagnostics_service_1 = require("../services/heap-diagnostics.service");
const process_internals_service_1 = require("../services/process-internals.service");
function createE2EDiagnosticsRouter() {
    const router = (0, express_1.Router)();
    const heapDiagnostics = di_1.Container.get(heap_diagnostics_service_1.HeapDiagnosticsService);
    const handle = (handler) => async (req, res) => {
        try {
            const data = await handler(req, res);
            if (data !== undefined)
                res.json({ data });
        }
        catch (error) {
            if (res.headersSent)
                res.destroy();
            else
                ResponseHelper.sendErrorResponse(res, (0, ensure_error_1.ensureError)(error));
        }
    };
    router.get('/internals', handle(() => di_1.Container.get(process_internals_service_1.ProcessInternalsService).collect()));
    router.post('/gc', handle(() => heapDiagnostics.collectGarbage()));
    router.post('/heap-snapshot', handle(() => heapDiagnostics.writeHeapSnapshot()));
    router.get('/heap-snapshot/:filename', handle(async (req, res) => {
        const stream = heapDiagnostics.openHeapSnapshot(String(req.params.filename));
        res.setHeader('Content-Type', 'application/octet-stream');
        await (0, promises_1.pipeline)(stream, res);
        return undefined;
    }));
    return router;
}
//# sourceMappingURL=e2e-diagnostics.router.js.map