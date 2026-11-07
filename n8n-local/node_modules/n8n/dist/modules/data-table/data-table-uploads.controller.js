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
exports.DataTableUploadsController = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const multer_1 = __importDefault(require("multer"));
const errors_1 = require("@n8n/errors");
const csv_parser_service_1 = require("./csv-parser.service");
const multer_upload_middleware_1 = require("./multer-upload-middleware");
const types_1 = require("./types");
const uploadMiddleware = di_1.Container.get(multer_upload_middleware_1.MulterUploadMiddleware);
let DataTableUploadsController = class DataTableUploadsController {
    constructor(csvParserService) {
        this.csvParserService = csvParserService;
    }
    async uploadFile(req, _res) {
        if (req.fileUploadError) {
            const error = req.fileUploadError;
            if (error instanceof multer_1.default.MulterError) {
                throw new errors_1.BadRequestError(`File upload error: ${error.message}`);
            }
            else if (error instanceof errors_1.BadRequestError) {
                throw error;
            }
            else {
                throw new errors_1.BadRequestError('File upload failed');
            }
        }
        if (!req.file) {
            throw new errors_1.BadRequestError('No file uploaded');
        }
        const hasHeaders = (0, types_1.hasStringProperty)(req.body, 'hasHeaders') && req.body.hasHeaders === 'false' ? false : true;
        const metadata = await this.csvParserService.parseFile(req.file.filename, hasHeaders);
        return {
            originalName: req.file.originalname,
            id: req.file.filename,
            rowCount: metadata.rowCount,
            columnCount: metadata.columnCount,
            columns: metadata.columns,
        };
    }
};
exports.DataTableUploadsController = DataTableUploadsController;
__decorate([
    (0, decorators_1.Post)('/', {
        middlewares: [uploadMiddleware.single('file')],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Response]),
    __metadata("design:returntype", Promise)
], DataTableUploadsController.prototype, "uploadFile", null);
exports.DataTableUploadsController = DataTableUploadsController = __decorate([
    (0, decorators_1.RestController)('/data-tables/uploads'),
    __metadata("design:paramtypes", [csv_parser_service_1.CsvParserService])
], DataTableUploadsController);
//# sourceMappingURL=data-table-uploads.controller.js.map