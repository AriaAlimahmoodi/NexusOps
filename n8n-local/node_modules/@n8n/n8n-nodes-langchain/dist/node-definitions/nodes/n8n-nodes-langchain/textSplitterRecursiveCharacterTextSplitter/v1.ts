/**
 * Recursive Character Text Splitter Node - Version 1
 * Split text into chunks by characters recursively, recommended for most use cases
 */


export interface LcTextSplitterRecursiveCharacterTextSplitterV1Params {
  chunkSize?: number | Expression<number>;
  chunkOverlap?: number | Expression<number>;
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Split Code
     * @default markdown
     */
    splitCode?: 'cpp' | 'go' | 'java' | 'js' | 'php' | 'proto' | 'python' | 'rst' | 'ruby' | 'rust' | 'scala' | 'swift' | 'markdown' | 'latex' | 'html' | Expression<string>;
  };
}

interface LcTextSplitterRecursiveCharacterTextSplitterV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter';
  version: 1;
}

export type LcTextSplitterRecursiveCharacterTextSplitterV1ParamsNode = LcTextSplitterRecursiveCharacterTextSplitterV1NodeBase & {
  config: NodeConfig<LcTextSplitterRecursiveCharacterTextSplitterV1Params>;
};

export type LcTextSplitterRecursiveCharacterTextSplitterV1Node = LcTextSplitterRecursiveCharacterTextSplitterV1ParamsNode;