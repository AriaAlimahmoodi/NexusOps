/**
 * Track Time Saved Node - Version 1
 * Dynamically track time saved based on the workflow’s execution path and the number of items processed
 */


export interface TimeSavedV1Params {
  mode?: 'once' | 'perItem';
/**
 * Number of minutes saved by this workflow execution
 * @default 0
 */
    minutesSaved?: number;
}

interface TimeSavedV1NodeBase {
  type: 'n8n-nodes-base.timeSaved';
  version: 1;
}

export type TimeSavedV1ParamsNode = TimeSavedV1NodeBase & {
  config: NodeConfig<TimeSavedV1Params>;
};

export type TimeSavedV1Node = TimeSavedV1ParamsNode;