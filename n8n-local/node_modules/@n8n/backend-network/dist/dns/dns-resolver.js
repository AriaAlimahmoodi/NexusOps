"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnsResolver = void 0;
const di_1 = require("@n8n/di");
const node_dns_1 = require("node:dns");
const in_memory_dns_cache_service_1 = require("./in-memory-dns-cache.service");
const LOOKUP_CACHE_TTL_SECONDS = 1;
let DnsResolver = class DnsResolver {
    constructor(dnsCache) {
        this.dnsCache = dnsCache;
        this.inFlightByCacheKey = new Map();
    }
    async lookup(hostname, options = {}) {
        const normalized = this.normalizeOptions(options);
        const cacheKey = this.buildCacheKey(hostname, normalized);
        const cached = await this.dnsCache.get(cacheKey);
        if (cached)
            return cached;
        const existing = this.inFlightByCacheKey.get(cacheKey);
        if (existing)
            return await existing;
        const lookupPromise = (async () => {
            const addresses = await this.doLookup(hostname, normalized);
            if (addresses.length > 0) {
                await this.dnsCache.set(cacheKey, addresses, LOOKUP_CACHE_TTL_SECONDS);
            }
            return addresses;
        })();
        this.inFlightByCacheKey.set(cacheKey, lookupPromise);
        return await lookupPromise.finally(() => {
            this.inFlightByCacheKey.delete(cacheKey);
        });
    }
    async doLookup(hostname, options) {
        if (options.all) {
            const records = await node_dns_1.promises.lookup(hostname, {
                all: true,
                family: options.family,
                order: options.order,
                verbatim: options.verbatim,
                hints: options.hints,
            });
            return records;
        }
        const record = await node_dns_1.promises.lookup(hostname, {
            all: false,
            family: options.family,
            order: options.order,
            verbatim: options.verbatim,
            hints: options.hints,
        });
        return [record];
    }
    buildCacheKey(hostname, options) {
        const order = options.order ?? '-';
        const verbatim = options.verbatim === undefined ? '-' : options.verbatim ? '1' : '0';
        return `${hostname}|a:${options.all ? '1' : '0'}|f:${options.family}|o:${order}|v:${verbatim}|h:${options.hints ?? 0}`;
    }
    normalizeOptions(options) {
        const all = options.all === true;
        const family = this.normalizeIpFamily(options.family);
        const order = options.order;
        const verbatim = options.verbatim;
        return { all, family, order, verbatim, hints: options.hints };
    }
    normalizeIpFamily(family) {
        if (family === 4 || family === 6 || family === 0) {
            return family;
        }
        if (family === 'IPv4') {
            return 4;
        }
        if (family === 'IPv6') {
            return 6;
        }
        return 0;
    }
};
exports.DnsResolver = DnsResolver;
exports.DnsResolver = DnsResolver = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [in_memory_dns_cache_service_1.InMemoryDnsCache])
], DnsResolver);
//# sourceMappingURL=dns-resolver.js.map