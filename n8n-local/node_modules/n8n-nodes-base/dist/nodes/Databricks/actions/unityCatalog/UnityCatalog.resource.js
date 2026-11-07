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
exports.listCatalogs = exports.deleteCatalog = exports.updateCatalog = exports.getCatalog = exports.createCatalog = exports.listFunctions = exports.getFunction = exports.deleteFunction = exports.createFunction = exports.deleteTable = exports.createTable = exports.listTables = exports.getTable = exports.listVolumes = exports.getVolume = exports.deleteVolume = exports.createVolume = void 0;
exports.createVolume = __importStar(require("./createVolume.operation"));
exports.deleteVolume = __importStar(require("./deleteVolume.operation"));
exports.getVolume = __importStar(require("./getVolume.operation"));
exports.listVolumes = __importStar(require("./listVolumes.operation"));
exports.getTable = __importStar(require("./getTable.operation"));
exports.listTables = __importStar(require("./listTables.operation"));
exports.createTable = __importStar(require("./createTable.operation"));
exports.deleteTable = __importStar(require("./deleteTable.operation"));
exports.createFunction = __importStar(require("./createFunction.operation"));
exports.deleteFunction = __importStar(require("./deleteFunction.operation"));
exports.getFunction = __importStar(require("./getFunction.operation"));
exports.listFunctions = __importStar(require("./listFunctions.operation"));
exports.createCatalog = __importStar(require("./createCatalog.operation"));
exports.getCatalog = __importStar(require("./getCatalog.operation"));
exports.updateCatalog = __importStar(require("./updateCatalog.operation"));
exports.deleteCatalog = __importStar(require("./deleteCatalog.operation"));
exports.listCatalogs = __importStar(require("./listCatalogs.operation"));
//# sourceMappingURL=UnityCatalog.resource.js.map