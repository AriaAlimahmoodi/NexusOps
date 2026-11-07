declare const BASE_BRANCH_ENTITIES: {
    readonly projects: {
        readonly directory: 'projects';
        readonly fileName: 'project.json';
        readonly type: 'project';
        readonly includeRoot: true;
    };
    readonly folders: {
        readonly directory: 'folders';
        readonly fileName: 'folder.json';
        readonly type: 'folder';
        readonly includeRoot: false;
    };
    readonly workflows: {
        readonly directory: 'workflows';
        readonly fileName: 'workflow.json';
        readonly type: 'workflow';
        readonly includeRoot: false;
    };
    readonly credentials: {
        readonly directory: 'credentials';
        readonly fileName: 'credential.json';
        readonly type: 'credential';
        readonly includeRoot: true;
    };
    readonly dataTables: {
        readonly directory: 'data-tables';
        readonly fileName: 'data-table.json';
        readonly type: 'dataTable';
        readonly includeRoot: true;
    };
    readonly variables: {
        readonly directory: 'variables';
        readonly fileName: 'variable.json';
        readonly type: 'variable';
        readonly includeRoot: true;
    };
    readonly tags: {
        readonly directory: 'tags';
        readonly fileName: 'tag.json';
        readonly type: 'tag';
        readonly includeRoot: true;
    };
};
type BaseBranchEntity = (typeof BASE_BRANCH_ENTITIES)[keyof typeof BASE_BRANCH_ENTITIES];
export type PackageFile = Readonly<{
    entityId: string;
    slug: string;
    projectId: string | null;
    fileName: BaseBranchEntity['fileName'];
    path: string;
    blobSha: string;
    type: BaseBranchEntity['type'];
}>;
export declare const BASE_BRANCH_DIRECTORIES: string[];
export declare function parseBaseBranchFiles(lsTreeOutput: string, options: {
    exportRoot: string;
    projectId: string;
}): PackageFile[];
export declare function parsePackageFiles(packageFiles: Array<{
    path: string;
    blobSha: string;
}>, { exportRoot, projectId }: {
    exportRoot: string;
    projectId: string;
}): PackageFile[];
export {};
