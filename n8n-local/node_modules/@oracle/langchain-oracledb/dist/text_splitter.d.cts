import oracledb from "oracledb";
import { TextSplitter, TextSplitterParams } from "@langchain/textsplitters";
/**
 * Split text into smaller pieces
 * @example
 * ```typescript
 * const splitter = new OracleTextSplitter(conn, params);
 * let chunks = await splitter.splitText(doc.pageContent);
 * ```
 */
export declare class OracleTextSplitter extends TextSplitter {
    protected conn: oracledb.Connection;
    protected pref: Record<string, unknown>;
    static lc_name(): string;
    constructor(conn: oracledb.Connection, pref: Record<string, unknown>, fields?: TextSplitterParams);
    splitText(text: string): Promise<string[]>;
}
