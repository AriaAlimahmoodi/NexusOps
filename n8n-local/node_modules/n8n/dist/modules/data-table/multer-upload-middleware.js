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
exports.MulterUploadMiddleware = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const bytes_1 = require("@n8n/utils/number/bytes");
const promises_1 = require("fs/promises");
const multer_1 = __importDefault(require("multer"));
const nanoid_1 = require("nanoid");
const path_1 = require("path");
const errors_1 = require("@n8n/errors");
const data_table_size_validator_service_1 = require("./data-table-size-validator.service");
const data_table_repository_1 = require("./data-table.repository");
const ALLOWED_EXTENSIONS = ['.csv'];
let MulterUploadMiddleware = class MulterUploadMiddleware {
    constructor(globalConfig, sizeValidator, dataTableRepository, logger) {
        this.globalConfig = globalConfig;
        this.sizeValidator = sizeValidator;
        this.dataTableRepository = dataTableRepository;
        this.logger = logger;
        this.quotaCheckChain = Promise.resolve();
        this.uploadDir = this.globalConfig.dataTable.uploadDir;
        void this.ensureUploadDirExists();
        const storage = multer_1.default.diskStorage({
            destination: (_req, _file, cb) => {
                cb(null, this.uploadDir);
            },
            filename: (_req, _file, cb) => {
                const filename = (0, nanoid_1.nanoid)(10);
                cb(null, filename);
            },
        });
        this.upload = (0, multer_1.default)({
            storage,
            limits: {
                fileSize: this.globalConfig.dataTable.uploadMaxFileSize ?? this.globalConfig.dataTable.maxSize,
            },
            fileFilter: (_req, file, cb) => {
                if (!ALLOWED_EXTENSIONS.includes((0, path_1.extname)(file.originalname).toLowerCase())) {
                    cb(new errors_1.BadRequestError(`Only the following file types are allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
                    return;
                }
                cb(null, true);
            },
        });
    }
    async ensureUploadDirExists() {
        await (0, promises_1.mkdir)(this.uploadDir, { recursive: true });
    }
    async getUploadDirSize() {
        const files = await (0, promises_1.readdir)(this.uploadDir);
        let total = 0;
        for (const file of files) {
            try {
                const stats = await (0, promises_1.stat)((0, backend_common_1.safeJoinPath)(this.uploadDir, file));
                if (stats.isFile())
                    total += stats.size;
            }
            catch (error) {
                this.logger.debug('Failed to stat data-table upload file', { file, error });
            }
        }
        return total;
    }
    single(fieldName) {
        return (req, res, next) => {
            void this.upload.single(fieldName)(req, res, async (error) => {
                const authedReq = req;
                if (error) {
                    authedReq.fileUploadError = error;
                    next();
                    return;
                }
                if (authedReq.file) {
                    try {
                        await this.enqueueQuotaCheck(authedReq.file.path);
                    }
                    catch (err) {
                        authedReq.fileUploadError = err;
                    }
                }
                next();
            });
        };
    }
    async enqueueQuotaCheck(uploadPath) {
        const next = this.quotaCheckChain
            .catch(() => { })
            .then(async () => await this.enforceQuotaPostUpload(uploadPath));
        this.quotaCheckChain = next.catch(() => { });
        await next;
    }
    async enforceQuotaPostUpload(uploadPath) {
        let usedBytes;
        try {
            const sizeData = await this.sizeValidator.getCachedSizeData(async () => {
                return await this.dataTableRepository.findDataTablesSize();
            });
            const tempBytes = await this.getUploadDirSize();
            usedBytes = sizeData.totalBytes + tempBytes;
        }
        catch (error) {
            this.logger.warn('Failed to validate data-table storage budget; rejecting upload', {
                path: uploadPath,
                error,
            });
            await this.removeUpload(uploadPath);
            throw new errors_1.BadRequestError('Could not validate storage limit');
        }
        if (usedBytes > this.globalConfig.dataTable.maxSize) {
            await this.removeUpload(uploadPath);
            throw new errors_1.BadRequestError(`Storage limit exceeded. Current usage: ${(0, bytes_1.formatBytes)(usedBytes)}, Limit: ${(0, bytes_1.formatBytes)(this.globalConfig.dataTable.maxSize)}`);
        }
    }
    async removeUpload(uploadPath) {
        try {
            await (0, promises_1.unlink)(uploadPath);
        }
        catch (error) {
            this.logger.warn('Failed to remove data-table upload after quota rejection', {
                path: uploadPath,
                error,
            });
        }
    }
};
exports.MulterUploadMiddleware = MulterUploadMiddleware;
exports.MulterUploadMiddleware = MulterUploadMiddleware = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, data_table_size_validator_service_1.DataTableSizeValidator, data_table_repository_1.DataTableRepository, backend_common_1.Logger])
], MulterUploadMiddleware);
//# sourceMappingURL=multer-upload-middleware.js.map