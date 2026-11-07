import { Document } from "@langchain/core/documents";
import oracledb from "oracledb";
import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
/**
 * Load documents from a file, a directory, or a table
 * If the document isn't a plain text file such as a PDF,
 * a plain text version will be extracted using utl_to_text
 * @example
 * ```typescript
 * const loader = new OracleDocLoader(conn, params);
 * const docs = await loader.load();
 * ```
 */
export declare class OracleDocLoader extends BaseDocumentLoader {
    protected conn: oracledb.Connection;
    protected pref: Record<string, any>;
    constructor(conn: oracledb.Connection, pref: Record<string, any>);
    /**
     * A method that loads the text file or blob and returns a promise that
     * resolves to an array of `Document` instances. It reads the text from
     * the file or blob using the `readFile` function from the
     * `node:fs/promises` module or the `text()` method of the blob. It then
     * parses the text using the `parse()` method and creates a `Document`
     * instance for each parsed page. The metadata includes the source of the
     * text (file path or blob) and, if there are multiple pages, the line
     * number of each page.
     * @returns A promise that resolves to an array of `Document` instances.
     */
    load(): Promise<Document[]>;
    private _loadFromFile;
    private _loadFromTable;
    private _extract;
}
