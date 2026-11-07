import { PROMOTION_BRANCH_PREFIX } from '@n8n/api-types';
export { PROMOTION_BRANCH_PREFIX };
export declare const PROMOTION_KEY_COMMENT = "n8n promotions";
export declare const GIT_DEFAULT_COMMIT_NAME = "n8n user";
export declare const GIT_DEFAULT_COMMIT_EMAIL = "n8n@example.com";
export declare const PROMOTE_SELECTION_COMMIT_MESSAGE = "Promote a selection of project changes";
export declare const PACKAGE_SUBFOLDER = "n8n";
export declare const DIRECTION_LABELS: {
    readonly apply: 'Apply';
    readonly promote: 'Promote';
};
export declare const SSH_CONNECT_TIMEOUT_SECONDS = 30;
export declare const SSH_SERVER_ALIVE_INTERVAL_SECONDS = 15;
export declare const SSH_SERVER_ALIVE_COUNT_MAX = 3;
export declare const HTTP_LOW_SPEED_LIMIT_BYTES = 1000;
export declare const HTTP_LOW_SPEED_TIME_SECONDS = 30;
export declare const GIT_COMMAND_STALL_TIMEOUT_MS = 60000;
export declare const GIT_READ_CONCURRENCY = 4;
