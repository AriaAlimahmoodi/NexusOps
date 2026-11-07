import type { PackageFile } from './base-branch-files';
export type PackageFileChange = {
    change: 'added';
    desired: PackageFile;
} | {
    change: 'deleted';
    base: PackageFile;
} | {
    change: 'modified' | 'renamed' | 'renamed-and-modified';
    base: PackageFile;
    desired: PackageFile;
};
export declare function diffPackageFiles(base: readonly PackageFile[], desired: readonly PackageFile[]): PackageFileChange[];
