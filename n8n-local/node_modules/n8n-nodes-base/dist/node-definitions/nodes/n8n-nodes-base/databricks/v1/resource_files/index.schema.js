/**
 * Databricks - Files Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCreateDirectorySchema = require('./operation_create_directory.schema');
const getDeleteDirectorySchema = require('./operation_delete_directory.schema');
const getDeleteFileSchema = require('./operation_delete_file.schema');
const getDownloadFileSchema = require('./operation_download_file.schema');
const getGetFileInfoSchema = require('./operation_get_file_info.schema');
const getListDirectorySchema = require('./operation_list_directory.schema');
const getUploadFileSchema = require('./operation_upload_file.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'listDirectory' } : parameters;
  return z.union([
    getCreateDirectorySchema({ ...helpers, parameters: effectiveParams }),
    getDeleteDirectorySchema({ ...helpers, parameters: effectiveParams }),
    getDeleteFileSchema({ ...helpers, parameters: effectiveParams }),
    getDownloadFileSchema({ ...helpers, parameters: effectiveParams }),
    getGetFileInfoSchema({ ...helpers, parameters: effectiveParams }),
    getListDirectorySchema({ ...helpers, parameters: effectiveParams }),
    getUploadFileSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};