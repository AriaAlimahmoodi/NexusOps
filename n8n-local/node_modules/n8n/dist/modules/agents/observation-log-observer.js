"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_OBSERVATION_LOG_TAIL_LIMIT = exports.DEFAULT_OBSERVER_THRESHOLD_TOKENS = exports.DEFAULT_OBSERVER_PROMPT = exports.createN8nObservationLogObserveFn = exports.buildN8nObservationLogObserverPrompt = void 0;
var agents_1 = require("@n8n/agents");
Object.defineProperty(exports, "buildN8nObservationLogObserverPrompt", { enumerable: true, get: function () { return agents_1.buildObservationLogObserverPrompt; } });
Object.defineProperty(exports, "createN8nObservationLogObserveFn", { enumerable: true, get: function () { return agents_1.createObservationLogObserveFn; } });
Object.defineProperty(exports, "DEFAULT_OBSERVER_PROMPT", { enumerable: true, get: function () { return agents_1.DEFAULT_OBSERVATION_LOG_OBSERVER_PROMPT; } });
Object.defineProperty(exports, "DEFAULT_OBSERVER_THRESHOLD_TOKENS", { enumerable: true, get: function () { return agents_1.DEFAULT_OBSERVATION_LOG_OBSERVER_THRESHOLD_TOKENS; } });
Object.defineProperty(exports, "DEFAULT_OBSERVATION_LOG_TAIL_LIMIT", { enumerable: true, get: function () { return agents_1.DEFAULT_OBSERVATION_LOG_TAIL_LIMIT; } });
//# sourceMappingURL=observation-log-observer.js.map