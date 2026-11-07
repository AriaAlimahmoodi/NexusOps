"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GIT_READ_CONCURRENCY = exports.GIT_COMMAND_STALL_TIMEOUT_MS = exports.HTTP_LOW_SPEED_TIME_SECONDS = exports.HTTP_LOW_SPEED_LIMIT_BYTES = exports.SSH_SERVER_ALIVE_COUNT_MAX = exports.SSH_SERVER_ALIVE_INTERVAL_SECONDS = exports.SSH_CONNECT_TIMEOUT_SECONDS = exports.DIRECTION_LABELS = exports.PACKAGE_SUBFOLDER = exports.PROMOTE_SELECTION_COMMIT_MESSAGE = exports.GIT_DEFAULT_COMMIT_EMAIL = exports.GIT_DEFAULT_COMMIT_NAME = exports.PROMOTION_KEY_COMMENT = exports.PROMOTION_BRANCH_PREFIX = void 0;
const api_types_1 = require("@n8n/api-types");
Object.defineProperty(exports, "PROMOTION_BRANCH_PREFIX", { enumerable: true, get: function () { return api_types_1.PROMOTION_BRANCH_PREFIX; } });
exports.PROMOTION_KEY_COMMENT = 'n8n promotions';
exports.GIT_DEFAULT_COMMIT_NAME = 'n8n user';
exports.GIT_DEFAULT_COMMIT_EMAIL = 'n8n@example.com';
exports.PROMOTE_SELECTION_COMMIT_MESSAGE = 'Promote a selection of project changes';
exports.PACKAGE_SUBFOLDER = 'n8n';
exports.DIRECTION_LABELS = { apply: 'Apply', promote: 'Promote' };
exports.SSH_CONNECT_TIMEOUT_SECONDS = 30;
exports.SSH_SERVER_ALIVE_INTERVAL_SECONDS = 15;
exports.SSH_SERVER_ALIVE_COUNT_MAX = 3;
exports.HTTP_LOW_SPEED_LIMIT_BYTES = 1000;
exports.HTTP_LOW_SPEED_TIME_SECONDS = 30;
exports.GIT_COMMAND_STALL_TIMEOUT_MS = 60_000;
exports.GIT_READ_CONCURRENCY = 4;
//# sourceMappingURL=constants.js.map