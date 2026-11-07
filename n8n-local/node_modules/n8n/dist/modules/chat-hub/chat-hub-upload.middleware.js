"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHubUploadMiddleware = void 0;
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const multer_1 = __importDefault(require("multer"));
let ChatHubUploadMiddleware = class ChatHubUploadMiddleware {
    constructor(globalConfig) {
        const maxFileSizeBytes = globalConfig.endpoints.formDataFileSizeMax * 1024 * 1024;
        this.upload = (0, multer_1.default)({
            storage: multer_1.default.diskStorage({}),
            limits: { fileSize: maxFileSizeBytes },
        });
    }
    array(fieldName) {
        return (req, res, next) => {
            void this.upload.array(fieldName)(req, res, (error) => {
                if (error) {
                    req.fileUploadError = error;
                }
                next();
            });
        };
    }
};
exports.ChatHubUploadMiddleware = ChatHubUploadMiddleware;
exports.ChatHubUploadMiddleware = ChatHubUploadMiddleware = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig])
], ChatHubUploadMiddleware);
//# sourceMappingURL=chat-hub-upload.middleware.js.map