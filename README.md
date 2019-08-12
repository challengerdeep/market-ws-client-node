# Sample Node.js client for [Kaiko Market WebSocket API](https://gist.github.com/Fonsan/6098b599886fbd8f06ce91712892aa92)

Included is a reusable client (`src/Client.ts`) and a sample CLI application (`src/example-cli.ts`).

## Requirements

* Node.js (Tested with version 10.16.0)

### Building

`npm i && npm run build`

### Running the sample client

See [documentation](https://docs.kaiko.com/#websocket-market-data-api) for explanation of [instrument selection](https://docs.kaiko.com/#instrument-selection).

`echo $SUBSCRIPTIONS | node dist/example-cli-rpc.js $ENDPOINT $API_KEY`

### Example (subscription endpoint)
`node dist/example-cli-subscription.js wss://us.market-ws.kaiko.io/v2/data/trades_ws.v1/bfnx:spot:btc-usd INSERT_API_KEY_HERE`

### Example (RPC endpoint)
`echo '{"topic":"trades","pattern":"bfnx:spot:eth-eur,btc-usd","data_version":"v1"}' | node dist/example-cli-rpc.js wss://us.market-ws.kaiko.io/v2/rpc INSERT_API_KEY_HERE`
