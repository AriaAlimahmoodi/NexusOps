"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSO_LOGIN_FAILED_REDIRECT_PATH = exports.SSO_ACCESS_DENIED_REDIRECT_PATH = exports.PROVISIONING_PREFERENCES_DB_KEY = void 0;
const api_types_1 = require("@n8n/api-types");
exports.PROVISIONING_PREFERENCES_DB_KEY = 'features.provisioning';
exports.SSO_ACCESS_DENIED_REDIRECT_PATH = `/signin?${api_types_1.SSO_ERROR_QUERY_PARAM}=${api_types_1.SSO_ERROR_ACCESS_DENIED}`;
exports.SSO_LOGIN_FAILED_REDIRECT_PATH = `/signin?${api_types_1.SSO_ERROR_QUERY_PARAM}=${api_types_1.SSO_ERROR_LOGIN_FAILED}`;
//# sourceMappingURL=constants.js.map