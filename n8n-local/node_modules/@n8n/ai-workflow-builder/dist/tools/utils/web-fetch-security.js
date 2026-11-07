"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLangGraphSecurityManagerFactory = createLangGraphSecurityManagerFactory;
exports.createMutableSecurityManagerFactory = createMutableSecurityManagerFactory;
const langgraph_1 = require("@langchain/langgraph");
const constants_1 = require("../../constants");
const allowed_domains_1 = require("./allowed-domains");
const web_fetch_utils_1 = require("./web-fetch.utils");
function createSecurityManager(config) {
    const approvedDomains = [...config.approvedDomains];
    const newlyApprovedDomains = [];
    let allDomainsApproved = config.allDomainsApproved;
    let webFetchCount = config.webFetchCount;
    return {
        isHostAllowed(host, url) {
            if (allDomainsApproved)
                return true;
            if ((0, allowed_domains_1.isAllowedDomain)(host))
                return true;
            if (approvedDomains.includes(host))
                return true;
            if ((0, web_fetch_utils_1.isUrlInUserMessages)(url, config.messages))
                return true;
            return false;
        },
        approveDomain(domain) {
            if (!approvedDomains.includes(domain)) {
                approvedDomains.push(domain);
                newlyApprovedDomains.push(domain);
            }
        },
        approveAllDomains() {
            allDomainsApproved = true;
        },
        hasBudget() {
            return webFetchCount < config.maxFetchesPerTurn;
        },
        recordFetch() {
            webFetchCount++;
        },
        getStateUpdates() {
            const updates = {};
            if (newlyApprovedDomains.length > 0) {
                updates.approvedDomains = newlyApprovedDomains;
            }
            if (allDomainsApproved && !config.allDomainsApproved) {
                updates.allDomainsApproved = true;
            }
            return updates;
        },
    };
}
function createFactory(options) {
    return () => {
        const state = options.stateProvider();
        const inner = createSecurityManager({ ...state, maxFetchesPerTurn: constants_1.WEB_FETCH_MAX_PER_TURN });
        if (!options.writeThrough)
            return inner;
        const target = options.writeThrough;
        return {
            isHostAllowed: (host, url) => inner.isHostAllowed(host, url),
            hasBudget: () => inner.hasBudget(),
            getStateUpdates: () => inner.getStateUpdates(),
            approveDomain(domain) {
                inner.approveDomain(domain);
                if (!target.approvedDomains.includes(domain))
                    target.approvedDomains.push(domain);
            },
            approveAllDomains() {
                inner.approveAllDomains();
                target.allDomainsApproved = true;
            },
            recordFetch() {
                inner.recordFetch();
                target.webFetchCount++;
            },
        };
    };
}
function createLangGraphSecurityManagerFactory() {
    return createFactory({
        stateProvider: () => {
            const s = (0, langgraph_1.getCurrentTaskInput)();
            return {
                approvedDomains: s.approvedDomains ?? [],
                allDomainsApproved: s.allDomainsApproved === true,
                webFetchCount: s.webFetchCount ?? 0,
                messages: s.messages ?? [],
            };
        },
    });
}
function createMutableSecurityManagerFactory(mutableState) {
    return createFactory({
        stateProvider: () => mutableState,
        writeThrough: mutableState,
    });
}
//# sourceMappingURL=web-fetch-security.js.map