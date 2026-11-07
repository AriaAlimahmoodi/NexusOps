import express from 'express';
import './v1/controllers';
export declare const loadPublicApiVersions: (publicApiEndpoint: string) => Promise<{
    apiRouters: express.Router[];
    apiLatestVersion: number;
}>;
export declare function isApiKeyAuthEnabled(): boolean;
