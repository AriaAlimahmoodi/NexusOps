import { CsvParserService } from './csv-parser.service';
import { AuthenticatedRequestWithFile } from './types';
export declare class DataTableUploadsController {
    private readonly csvParserService;
    constructor(csvParserService: CsvParserService);
    uploadFile(req: AuthenticatedRequestWithFile, _res: Response): Promise<{
        originalName: string;
        id: string;
        rowCount: number;
        columnCount: number;
        columns: import("./csv-parser.service").CsvColumnMetadata[];
    }>;
}
