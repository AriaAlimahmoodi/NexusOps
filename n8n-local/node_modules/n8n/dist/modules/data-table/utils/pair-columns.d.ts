type Pairable = {
    id?: string;
    name: string;
};
type ColumnPair = {
    source: {
        name: string;
        type: string;
    };
    target: {
        name: string;
        type: string;
    };
};
export declare function pairDataTableColumns<S extends Pairable, T extends Pairable>(source: S[], target: T[]): {
    pairs: Array<{
        source: S;
        target: T;
    }>;
    added: S[];
    removed: T[];
};
export declare function orderColumnRenames<P extends ColumnPair>(pairs: P[]): {
    ordered: P[];
    blocked: P[];
};
export {};
