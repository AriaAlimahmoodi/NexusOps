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
exports.FailedRunFactory = void 0;
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
let FailedRunFactory = class FailedRunFactory {
    constructor(storageConfig) {
        this.storageConfig = storageConfig;
    }
    generateFailedExecutionFromError(mode, error, node, startTime = Date.now()) {
        const executionError = {
            ...error,
            message: error.message,
            stack: error.stack,
        };
        const returnData = {
            data: (0, n8n_workflow_1.createRunExecutionData)({
                resultData: {
                    error: executionError,
                    runData: {},
                },
            }),
            finished: false,
            mode,
            startedAt: new Date(),
            stoppedAt: new Date(),
            status: 'error',
            storedAt: this.storageConfig.modeTag,
        };
        if (node) {
            returnData.data.startData = {
                destinationNode: {
                    nodeName: node.name,
                    mode: 'inclusive',
                },
                runNodeFilter: [node.name],
            };
            returnData.data.resultData.lastNodeExecuted = node.name;
            returnData.data.resultData.runData[node.name] = [
                {
                    startTime,
                    executionIndex: 0,
                    executionTime: 0,
                    executionStatus: 'error',
                    error: executionError,
                    source: [],
                },
            ];
            returnData.data.executionData = {
                contextData: {},
                metadata: {},
                waitingExecution: {},
                waitingExecutionSource: {},
                nodeExecutionStack: [
                    {
                        node,
                        data: {},
                        source: null,
                    },
                ],
            };
        }
        return returnData;
    }
};
exports.FailedRunFactory = FailedRunFactory;
exports.FailedRunFactory = FailedRunFactory = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.StorageConfig])
], FailedRunFactory);
//# sourceMappingURL=failed-run-factory.js.map