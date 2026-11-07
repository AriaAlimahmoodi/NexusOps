"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentUploadMiddleware = void 0;
exports.isAllowedAgentFile = isAllowedAgentFile;
exports.describeMulterError = describeMulterError;
exports.cleanupUploadedTempFiles = cleanupUploadedTempFiles;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const multer_1 = __importDefault(require("multer"));
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const errors_1 = require("@n8n/errors");
const allowedAgentFileExtensions = new Set(api_types_1.ALLOWED_AGENT_FILE_EXTENSIONS);
function isAllowedAgentFile(file) {
    const extension = node_path_1.default.extname(file.originalname).toLowerCase();
    return allowedAgentFileExtensions.has(extension);
}
function describeMulterError(error) {
    switch (error.code) {
        case 'LIMIT_UNEXPECTED_FILE':
            return `You can upload at most ${api_types_1.MAX_AGENT_FILES_PER_UPLOAD} files at a time`;
        case 'LIMIT_FILE_SIZE':
            return `Files must be ${api_types_1.MAX_AGENT_FILE_SIZE_BYTES / (1024 * 1024)} MB or smaller`;
        default:
            return error.message;
    }
}
async function cleanupUploadedTempFiles(files) {
    await Promise.all(files.map(async (file) => {
        if (!file.path)
            return;
        await (0, promises_1.unlink)(file.path).catch(() => { });
    }));
}
let AgentUploadMiddleware = class AgentUploadMiddleware {
    constructor() {
        this.upload = (0, multer_1.default)({
            storage: multer_1.default.diskStorage({}),
            limits: { fileSize: api_types_1.MAX_AGENT_FILE_SIZE_BYTES },
            fileFilter: (_req, file, done) => {
                if (!isAllowedAgentFile(file)) {
                    done(new errors_1.BadRequestError('Only CSV, PDF, Markdown, and TXT files are allowed'));
                    return;
                }
                done(null, true);
            },
        });
    }
    array(fieldName) {
        return (req, res, next) => {
            void this.upload.array(fieldName, api_types_1.MAX_AGENT_FILES_PER_UPLOAD)(req, res, (error) => {
                if (error) {
                    req.fileUploadError = error;
                }
                next();
            });
        };
    }
};
exports.AgentUploadMiddleware = AgentUploadMiddleware;
exports.AgentUploadMiddleware = AgentUploadMiddleware = __decorate([
    (0, di_1.Service)()
], AgentUploadMiddleware);
//# sourceMappingURL=agent-upload.middleware.js.map