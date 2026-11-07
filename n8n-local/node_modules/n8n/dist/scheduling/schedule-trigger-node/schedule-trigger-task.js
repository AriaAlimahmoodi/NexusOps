"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildScheduleTriggerItem = exports.scheduleTriggerDeduplicationKey = exports.isScheduleTriggerTaskPayload = exports.SCHEDULE_TRIGGER_TASK_TYPE = void 0;
const moment_timezone_1 = __importDefault(require("moment-timezone"));
exports.SCHEDULE_TRIGGER_TASK_TYPE = 'workflow:schedule-trigger';
var workflow_node_task_payload_1 = require("../workflow-node-task-payload");
Object.defineProperty(exports, "isScheduleTriggerTaskPayload", { enumerable: true, get: function () { return workflow_node_task_payload_1.isWorkflowNodeTaskPayload; } });
const scheduleTriggerDeduplicationKey = ({ jobId, scheduledFor, }) => `${jobId}:${scheduledFor.toISOString()}`;
exports.scheduleTriggerDeduplicationKey = scheduleTriggerDeduplicationKey;
const buildScheduleTriggerItem = (scheduledFor, timezone) => {
    const momentTz = moment_timezone_1.default.tz(scheduledFor, timezone);
    return {
        json: {
            timestamp: momentTz.toISOString(true),
            'Readable date': momentTz.format('MMMM Do YYYY, h:mm:ss a'),
            'Readable time': momentTz.format('h:mm:ss a'),
            'Day of week': momentTz.format('dddd'),
            Year: momentTz.format('YYYY'),
            Month: momentTz.format('MMMM'),
            'Day of month': momentTz.format('DD'),
            Hour: momentTz.format('HH'),
            Minute: momentTz.format('mm'),
            Second: momentTz.format('ss'),
            Timezone: `${timezone} (UTC${momentTz.format('Z')})`,
        },
    };
};
exports.buildScheduleTriggerItem = buildScheduleTriggerItem;
//# sourceMappingURL=schedule-trigger-task.js.map