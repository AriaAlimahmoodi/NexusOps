import type { PackageRequirementConsumer } from './requirements.schema';
export declare function getWorkflowConsumerIds(requirement: {
    usedBy: PackageRequirementConsumer[];
}): string[];
export declare function mergeRequirementConsumers(consumers: PackageRequirementConsumer[]): PackageRequirementConsumer[];
