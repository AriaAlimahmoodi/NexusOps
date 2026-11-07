"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryInstanceStorage = void 0;
class MemoryInstanceStorage {
    constructor() {
        this.kind = 'memory';
        this.localRegistration = null;
        this.lastKnownStateMap = new Map();
    }
    async register(registration) {
        this.localRegistration = registration;
    }
    async heartbeat(registration) {
        this.localRegistration = registration;
    }
    async unregister(instanceKey) {
        if (this.localRegistration?.instanceKey === instanceKey) {
            this.localRegistration = null;
        }
    }
    async getAllRegistrations() {
        return this.localRegistration ? [this.localRegistration] : [];
    }
    async getRegistration(instanceKey) {
        if (this.localRegistration?.instanceKey === instanceKey) {
            return this.localRegistration;
        }
        return null;
    }
    async getLastKnownState() {
        return new Map(this.lastKnownStateMap);
    }
    async saveLastKnownState(state) {
        this.lastKnownStateMap = new Map(state);
    }
    async cleanupStaleMembers() {
        return 0;
    }
    async destroy() { }
}
exports.MemoryInstanceStorage = MemoryInstanceStorage;
//# sourceMappingURL=memory-storage.js.map