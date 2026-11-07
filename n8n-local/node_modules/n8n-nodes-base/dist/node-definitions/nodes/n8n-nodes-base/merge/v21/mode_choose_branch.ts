/**
 * Merge Node - Version 2.1
 * Discriminator: mode=chooseBranch
 */


/** Output input data, without modifying it */
export type MergeV21ChooseBranchParams = {
  mode: 'chooseBranch';
/**
 * Output Type
 * @default waitForBoth
 */
    chooseBranchMode?: 'waitForBoth' | Expression<string>;
/**
 * Output
 * @displayOptions.show { chooseBranchMode: ["waitForBoth"] }
 * @default input1
 */
    output?: 'input1' | 'input2' | 'empty' | Expression<string>;
};

export type MergeV21ChooseBranchNode = {
  type: 'n8n-nodes-base.merge';
  version: 2.1;
  config: NodeConfig<MergeV21ChooseBranchParams>;
};