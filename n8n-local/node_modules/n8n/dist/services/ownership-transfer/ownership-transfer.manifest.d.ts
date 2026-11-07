export interface TransferredProjectResource {
    name: string;
    path: string;
}
export interface NotTransferredProjectResource extends TransferredProjectResource {
    reason: string;
}
export declare const TRANSFERRED_PROJECT_RESOURCES: readonly TransferredProjectResource[];
export declare const NOT_TRANSFERRED_PROJECT_RESOURCES: readonly NotTransferredProjectResource[];
