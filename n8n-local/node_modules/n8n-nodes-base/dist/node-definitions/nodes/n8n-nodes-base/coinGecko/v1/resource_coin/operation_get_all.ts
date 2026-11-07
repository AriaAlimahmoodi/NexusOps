/**
 * CoinGecko Node - Version 1
 * Discriminator: resource=coin, operation=getAll
 */


/** Get many coins */
export type CoinGeckoV1CoinGetAllParams = {
  resource: 'coin';
  operation: 'getAll';
/**
 * Whether to return all results or only up to a given limit
 * @default false
 */
    returnAll?: boolean | Expression<boolean>;
/**
 * Max number of results to return
 * @displayOptions.show { returnAll: [false] }
 * @default 100
 */
    limit?: number | Expression<number>;
};

export type CoinGeckoV1CoinGetAllOutput = {
  id?: string;
  name?: string;
  symbol?: string;
};

export type CoinGeckoV1CoinGetAllNode = {
  type: 'n8n-nodes-base.coinGecko';
  version: 1;
  config: NodeConfig<CoinGeckoV1CoinGetAllParams>;
  output?: Items<CoinGeckoV1CoinGetAllOutput>;
};