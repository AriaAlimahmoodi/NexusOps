import type { PersonalResourceOwner, StatusResourceOwner, TeamResourceOwner } from './resource-owner';
export interface ExportableDataTableColumn {
    id: string;
    name: string;
    type: string;
    index: number;
}
export type DataTableResourceOwner = PersonalResourceOwner | TeamResourceOwner;
export interface ExportableDataTable {
    id: string;
    name: string;
    columns: ExportableDataTableColumn[];
    createdAt: string;
    updatedAt: string;
    ownedBy: DataTableResourceOwner | null;
}
export type StatusExportableDataTable = Omit<ExportableDataTable, 'ownedBy'> & {
    filename: string;
    ownedBy: StatusResourceOwner | null;
};
