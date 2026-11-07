"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Severity = exports.Facility = exports.Transport = void 0;
var Transport;
(function (Transport) {
    Transport[Transport["Tcp"] = 1] = "Tcp";
    Transport[Transport["Udp"] = 2] = "Udp";
    Transport[Transport["Tls"] = 3] = "Tls";
    Transport[Transport["Unix"] = 4] = "Unix";
})(Transport || (exports.Transport = Transport = {}));
var Facility;
(function (Facility) {
    Facility[Facility["Kernel"] = 0] = "Kernel";
    Facility[Facility["User"] = 1] = "User";
    Facility[Facility["Mail"] = 2] = "Mail";
    Facility[Facility["System"] = 3] = "System";
    Facility[Facility["Daemon"] = 3] = "Daemon";
    Facility[Facility["Auth"] = 4] = "Auth";
    Facility[Facility["Syslog"] = 5] = "Syslog";
    Facility[Facility["Lpr"] = 6] = "Lpr";
    Facility[Facility["News"] = 7] = "News";
    Facility[Facility["Uucp"] = 8] = "Uucp";
    Facility[Facility["Cron"] = 9] = "Cron";
    Facility[Facility["Authpriv"] = 10] = "Authpriv";
    Facility[Facility["Ftp"] = 11] = "Ftp";
    Facility[Facility["Audit"] = 13] = "Audit";
    Facility[Facility["Alert"] = 14] = "Alert";
    Facility[Facility["Local0"] = 16] = "Local0";
    Facility[Facility["Local1"] = 17] = "Local1";
    Facility[Facility["Local2"] = 18] = "Local2";
    Facility[Facility["Local3"] = 19] = "Local3";
    Facility[Facility["Local4"] = 20] = "Local4";
    Facility[Facility["Local5"] = 21] = "Local5";
    Facility[Facility["Local6"] = 22] = "Local6";
    Facility[Facility["Local7"] = 23] = "Local7";
})(Facility || (exports.Facility = Facility = {}));
var Severity;
(function (Severity) {
    Severity[Severity["Emergency"] = 0] = "Emergency";
    Severity[Severity["Alert"] = 1] = "Alert";
    Severity[Severity["Critical"] = 2] = "Critical";
    Severity[Severity["Error"] = 3] = "Error";
    Severity[Severity["Warning"] = 4] = "Warning";
    Severity[Severity["Notice"] = 5] = "Notice";
    Severity[Severity["Informational"] = 6] = "Informational";
    Severity[Severity["Debug"] = 7] = "Debug";
})(Severity || (exports.Severity = Severity = {}));
//# sourceMappingURL=constants.js.map