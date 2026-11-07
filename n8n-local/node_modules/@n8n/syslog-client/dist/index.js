"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.TransportError = exports.TimeoutError = exports.SyslogClientError = exports.ConnectionError = exports.Transport = exports.Severity = exports.Facility = exports.createClient = exports.SyslogClient = void 0;
var client_1 = require("./client");
Object.defineProperty(exports, "SyslogClient", { enumerable: true, get: function () { return client_1.SyslogClient; } });
var factory_1 = require("./factory");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return factory_1.createClient; } });
var constants_1 = require("./constants");
Object.defineProperty(exports, "Facility", { enumerable: true, get: function () { return constants_1.Facility; } });
Object.defineProperty(exports, "Severity", { enumerable: true, get: function () { return constants_1.Severity; } });
Object.defineProperty(exports, "Transport", { enumerable: true, get: function () { return constants_1.Transport; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "ConnectionError", { enumerable: true, get: function () { return errors_1.ConnectionError; } });
Object.defineProperty(exports, "SyslogClientError", { enumerable: true, get: function () { return errors_1.SyslogClientError; } });
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return errors_1.TimeoutError; } });
Object.defineProperty(exports, "TransportError", { enumerable: true, get: function () { return errors_1.TransportError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_1.ValidationError; } });
//# sourceMappingURL=index.js.map