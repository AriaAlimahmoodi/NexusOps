import type { PromotionBindingPreflightResult } from '@n8n/api-types';
import { CredentialsRepository, ProjectRepository, VariablesRepository } from '@n8n/db';
import { CredentialTypes } from '../../credential-types';
import { DataTableImporter } from '../../modules/n8n-packages/entities/data-table/data-table-importer';
import { DataTableRequirementsExtractor } from '../../modules/n8n-packages/entities/data-table/data-table-requirements.extractor';
import { VariableRequirementsExtractor } from '../../modules/n8n-packages/entities/variable/variable-requirements.extractor';
import { PackageDirectoryInventoryReader, type PackageDirectoryInventory } from '../../modules/n8n-packages/io/directory/package-directory-inventory-reader';
import { PackageImportConfig } from '../../modules/n8n-packages/n8n-packages.config';
export declare class PromotionBindingPreflightService {
    private readonly packageImportConfig;
    private readonly inventoryReader;
    private readonly variableExtractor;
    private readonly dataTableExtractor;
    private readonly dataTableImporter;
    private readonly credentialTypes;
    private readonly credentialsRepository;
    private readonly variablesRepository;
    private readonly projectRepository;
    constructor(packageImportConfig: PackageImportConfig, inventoryReader: PackageDirectoryInventoryReader, variableExtractor: VariableRequirementsExtractor, dataTableExtractor: DataTableRequirementsExtractor, dataTableImporter: DataTableImporter, credentialTypes: CredentialTypes, credentialsRepository: CredentialsRepository, variablesRepository: VariablesRepository, projectRepository: ProjectRepository);
    checkDirectory({ sourceDir, selection, }: {
        sourceDir: string;
        selection?: {
            selectedProjectId: string;
            selectedWorkflowIds: string[];
        };
    }): Promise<PromotionBindingPreflightResult>;
    checkInventory({ inventory: packageInventory, selection, }: {
        inventory: PackageDirectoryInventory;
        selection?: {
            selectedProjectId: string;
            selectedWorkflowIds: string[];
        };
    }): Promise<PromotionBindingPreflightResult>;
    private checkProjectDeletions;
    private checkProjects;
    private checkCredentials;
    private checkVariables;
    private checkDataTables;
}
