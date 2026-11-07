import { BlockList } from 'node:net';
export interface IpRangeIssue {
    entry: string;
    error: string;
}
export interface IpRangeBuildResult {
    list: BlockList;
    issues: IpRangeIssue[];
}
export declare function buildIpRangeList(cidrRanges: readonly string[]): IpRangeBuildResult;
