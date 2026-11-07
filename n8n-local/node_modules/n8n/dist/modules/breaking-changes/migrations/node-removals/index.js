"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeRemovalMigrations = void 0;
const ai_transform_to_code_migration_1 = require("./ai-transform-to-code.migration");
const document_loaders_migration_1 = require("./document-loaders.migration");
const html_extract_to_html_migration_1 = require("./html-extract-to-html.migration");
const ical_to_convert_to_file_migration_1 = require("./ical-to-convert-to-file.migration");
const item_lists_migration_1 = require("./item-lists.migration");
const read_pdf_to_extract_from_file_migration_1 = require("./read-pdf-to-extract-from-file.migration");
const schedule_trigger_migration_1 = require("./schedule-trigger.migration");
const vector_stores_migration_1 = require("./vector-stores.migration");
const workflow_trigger_to_n8n_trigger_migration_1 = require("./workflow-trigger-to-n8n-trigger.migration");
const write_binary_file_to_read_write_file_migration_1 = require("./write-binary-file-to-read-write-file.migration");
exports.nodeRemovalMigrations = [
    ai_transform_to_code_migration_1.aiTransformToCode,
    document_loaders_migration_1.binaryInputLoaderToDefaultDataLoader,
    schedule_trigger_migration_1.cronToScheduleTrigger,
    html_extract_to_html_migration_1.htmlExtractToHtml,
    ical_to_convert_to_file_migration_1.icalToConvertToFile,
    vector_stores_migration_1.inMemoryInsertToVectorStore,
    vector_stores_migration_1.inMemoryLoadToVectorStore,
    item_lists_migration_1.itemListsToTransformNodes,
    document_loaders_migration_1.jsonInputLoaderToDefaultDataLoader,
    vector_stores_migration_1.pineconeInsertToVectorStore,
    vector_stores_migration_1.pineconeLoadToVectorStore,
    read_pdf_to_extract_from_file_migration_1.readPdfToExtractFromFile,
    vector_stores_migration_1.supabaseInsertToVectorStore,
    vector_stores_migration_1.supabaseLoadToVectorStore,
    workflow_trigger_to_n8n_trigger_migration_1.workflowTriggerToN8nTrigger,
    write_binary_file_to_read_write_file_migration_1.writeBinaryFileToReadWriteFile,
];
//# sourceMappingURL=index.js.map