import type { CreateDataTableDto } from '@n8n/api-types';
import { Logger } from '@n8n/backend-common';
import type { DataTableRow } from 'n8n-workflow';
import { CsvParserService } from './csv-parser.service';
import type { DataTableColumn } from './data-table-column.entity';
import { DataTableFileCleanupService } from './data-table-file-cleanup.service';
export declare class DataTableCsvImportService {
    private readonly csvParserService;
    private readonly fileCleanupService;
    private readonly logger;
    constructor(csvParserService: CsvParserService, fileCleanupService: DataTableFileCleanupService, logger: Logger);
    buildRowsForNewTable(fileId: string, hasHeaders: boolean, tableColumns: DataTableColumn[], dtoColumns?: CreateDataTableDto['columns']): Promise<DataTableRow[]>;
    validateAndBuildRowsForExistingTable(fileId: string, tableColumns: DataTableColumn[]): Promise<{
        rows: DataTableRow[];
        systemColumnsIgnored: string[];
    }>;
    cleanupFile(fileId: string): Promise<void>;
    private matchColumns;
    private transformRows;
    private buildColumnMappingForNewTable;
}
