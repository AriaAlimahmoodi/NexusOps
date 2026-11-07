import { LoadNodesAndCredentials } from '../load-nodes-and-credentials';
export declare class DevController {
    private readonly loadNodesAndCredentials;
    constructor(loadNodesAndCredentials: LoadNodesAndCredentials);
    reload(): Promise<{
        reloaded: string[];
    }>;
}
