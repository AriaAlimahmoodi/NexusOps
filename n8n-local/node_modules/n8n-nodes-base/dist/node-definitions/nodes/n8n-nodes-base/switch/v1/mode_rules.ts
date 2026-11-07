/**
 * Switch Node - Version 1
 * Discriminator: mode=rules
 */


/** Rules decide how to route data */
export type SwitchV1RulesParams = {
  mode: 'rules';
/**
 * The type of data to route on
 * @default number
 */
    dataType?: 'boolean' | 'dateTime' | 'number' | 'string' | Expression<string>;
/**
 * The value to compare with the first one
 * @displayOptions.show { dataType: ["boolean"] }
 * @default false
 */
    value1?: boolean | Expression<boolean>;
/**
 * Routing Rules
 * @displayOptions.show { dataType: ["boolean"] }
 * @default {}
 */
    rules?: {
        /** Boolean
     */
    rules?: Array<{
      /** Operation to decide where the data should be mapped to
       * @default equal
       */
      operation?: 'equal' | 'notEqual' | Expression<string>;
      /** The value to compare with the first one
       * @default false
       */
      value2?: boolean | Expression<boolean>;
      /** The index of output to which to send data to if rule matches
       * @default 0
       */
      output?: number | Expression<number>;
    }>;
  };
/**
 * The output to which to route all items which do not match any of the rules
 * @default -1
 */
    fallbackOutput?: -1 | 0 | 1 | 2 | 3 | Expression<number>;
};

export type SwitchV1RulesNode = {
  type: 'n8n-nodes-base.switch';
  version: 1;
  config: NodeConfig<SwitchV1RulesParams>;
};