"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAgentBlobByteStores = registerAgentBlobByteStores;
const blob_storage_1 = require("@n8n/blob-storage");
const di_1 = require("@n8n/di");
async function registerAgentBlobByteStores(stores) {
    const { executionDataJsonStore, agentExecutionLogStore, agentKnowledgeFileStore } = stores;
    if (executionDataJsonStore.hasLocation('s3')) {
        const { ObjectStoreService } = await import('@n8n/blob-storage/object-store');
        const s3Store = new blob_storage_1.S3ByteStore(di_1.Container.get(ObjectStoreService));
        agentExecutionLogStore.registerByteStore('s3', s3Store);
        agentKnowledgeFileStore.registerByteStore('s3', s3Store);
    }
    if (executionDataJsonStore.hasLocation('az')) {
        const { AzureBlobService } = await import('@n8n/blob-storage/azure-blob');
        const azStore = new blob_storage_1.AzureByteStore(di_1.Container.get(AzureBlobService));
        agentExecutionLogStore.registerByteStore('az', azStore);
        agentKnowledgeFileStore.registerByteStore('az', azStore);
    }
}
//# sourceMappingURL=register-blob-byte-stores.js.map