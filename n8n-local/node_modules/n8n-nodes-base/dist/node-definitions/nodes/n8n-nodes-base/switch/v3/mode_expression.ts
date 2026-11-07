/**
 * Switch Node - Version 3
 * Discriminator: mode=expression
 */


/** Write an expression to return the output index */
export type SwitchV3ExpressionParams = {
  mode: 'expression';
/**
 * How many outputs to create
 * @default 4
 */
    numberOutputs?: number | Expression<number>;
/**
 * The output index to send the input item to. Use an expression to calculate which input item should be routed to which output. The expression must return a number.
 * @hint The index to route the item to, starts at 0
 * @default ={{}}
 */
    output?: number | Expression<number>;
};

export type SwitchV3ExpressionNode = {
  type: 'n8n-nodes-base.switch';
  version: 3;
  config: NodeConfig<SwitchV3ExpressionParams>;
};