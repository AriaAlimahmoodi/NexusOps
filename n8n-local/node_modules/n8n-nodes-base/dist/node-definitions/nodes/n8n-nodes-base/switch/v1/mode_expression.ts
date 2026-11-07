/**
 * Switch Node - Version 1
 * Discriminator: mode=expression
 */


/** Expression decides how to route data */
export type SwitchV1ExpressionParams = {
  mode: 'expression';
/**
 * The index of output to which to send data to
 * @default 0
 */
    output?: number | Expression<number>;
};

export type SwitchV1ExpressionNode = {
  type: 'n8n-nodes-base.switch';
  version: 1;
  config: NodeConfig<SwitchV1ExpressionParams>;
};