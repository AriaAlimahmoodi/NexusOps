"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetEnvironmentTool = createGetEnvironmentTool;
const tool_1 = require("@n8n/agents/tool");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const luxon_1 = require("luxon");
const zod_1 = require("zod");
const DESCRIPTION = 'Returns runtime info that the LLM cannot know on its own: ' +
    'current ISO date/time, instance timezone (IANA), and day of week. ' +
    'Call when reasoning about "today", deadlines, or scheduling. Tool always requires an empty object as input.';
function createGetEnvironmentTool() {
    return (new tool_1.Tool('get_environment')
        .description(DESCRIPTION)
        .input(zod_1.z.object({}))
        .handler(async () => {
        const timezone = di_1.Container.get(config_1.GlobalConfig).generic.timezone;
        const now = luxon_1.DateTime.now().setZone(timezone);
        return {
            now: now.toISO(),
            timezone,
            dayOfWeek: now.weekdayLong,
        };
    }));
}
//# sourceMappingURL=environment-tool.js.map