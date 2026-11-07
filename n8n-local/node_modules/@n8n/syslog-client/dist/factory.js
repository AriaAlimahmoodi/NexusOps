"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const client_1 = require("./client");
function createClient(target, options) {
    return new client_1.SyslogClient(target, options);
}
//# sourceMappingURL=factory.js.map