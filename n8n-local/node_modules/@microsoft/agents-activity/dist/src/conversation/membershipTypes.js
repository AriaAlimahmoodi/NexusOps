"use strict";
/**
 * Copyright(c) Microsoft Corporation.All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipTypes = void 0;
/**
 * Enum expressing the users relationship to the current channel.
 */
var MembershipTypes;
(function (MembershipTypes) {
    /**
     * The user is a direct member of a channel.
     */
    MembershipTypes["Direct"] = "direct";
    /**
     * The user is a member of a channel through a group.
     */
    MembershipTypes["Transitive"] = "transitive";
})(MembershipTypes || (exports.MembershipTypes = MembershipTypes = {}));
//# sourceMappingURL=membershipTypes.js.map