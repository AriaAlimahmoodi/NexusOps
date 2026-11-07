/**
 * SearXNG Node - Version 1
 * Search in SearXNG
 */


export interface LcToolSearXngV1Params {
  options?: {
    /** Number of Results
     * @default 10
     */
    numResults?: number | Expression<number>;
    /** Search Page Number
     * @default 1
     */
    pageNumber?: number | Expression<number>;
    /** Defines the language to use. It's a two-letter language code. (e.g., `en` for English, `es` for Spanish, or `fr` for French). Head to &lt;a href="https://docs.searxng.org/user/search-syntax.html#select-language"&gt;SearXNG search syntax page&lt;/a&gt; for more info.
     * @default en
     */
    language?: string | Expression<string>;
    /** Filter search results of engines which support safe search
     * @default 0
     */
    safesearch?: 0 | 1 | 2 | Expression<number>;
  };
}

export interface LcToolSearXngV1Credentials {
  searXngApi: CredentialReference;
}

interface LcToolSearXngV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolSearXng';
  version: 1;
}

export type LcToolSearXngV1ParamsNode = LcToolSearXngV1NodeBase & {
  config: NodeConfig<LcToolSearXngV1Params> & { credentials?: LcToolSearXngV1Credentials };
};

export type LcToolSearXngV1Node = LcToolSearXngV1ParamsNode;