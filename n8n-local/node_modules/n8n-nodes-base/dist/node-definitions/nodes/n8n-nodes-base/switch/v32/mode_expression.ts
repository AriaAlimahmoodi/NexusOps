/**
 * Switch Node - Version 3.2
 * Discriminator: mode=expression
 */


/** Write an expression to return the output index */
export type SwitchV32ExpressionParams = {
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
/**
 * If the type of an expression doesn't match the type of the comparison, n8n will try to cast the expression to the required type. E.g. for booleans &lt;code&gt;"false"&lt;/code&gt; or &lt;code&gt;0&lt;/code&gt; will be cast to &lt;code&gt;false&lt;/code&gt;
 * @default false
 */
    looseTypeValidation?: boolean | Expression<boolean>;
};

export type SwitchV32ExpressionNode = {
  type: 'n8n-nodes-base.switch';
  version: 3.2;
  config: NodeConfig<SwitchV32ExpressionParams>;
};