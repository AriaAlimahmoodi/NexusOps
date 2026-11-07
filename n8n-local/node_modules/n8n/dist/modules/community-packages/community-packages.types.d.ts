export declare namespace CommunityPackages {
    type ParsedPackageName = {
        packageName: string;
        rawString: string;
        scope?: string;
        version?: string;
    };
    type AvailableUpdates = {
        [packageName: string]: {
            current: string;
            wanted: string;
            latest: string;
            location: string;
        };
    };
    type PackageStatusCheck = {
        status: 'OK' | 'Banned';
        reason?: string;
    };
}
