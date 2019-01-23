# Sample Node.js client for [Kaiko Market WebSocket API](https://gist.github.com/Fonsan/6098b599886fbd8f06ce91712892aa92)

Included is a reusable client (`src/Client.ts`) and a sample CLI application (`src/example-cli.ts`).

## Requirements

* Node.js (Tested with version 10.15.0)
* Typescript (Tested with version 3.1.3)

### Building

`npm i && npm run build`

### Running the sample client

See [documentation](https://gist.github.com/Fonsan/6098b599886fbd8f06ce91712892aa92) for explanation of the [subscriptions](https://gist.github.com/Fonsan/6098b599886fbd8f06ce91712892aa92#subscription-command) parameter.

`echo $SUBSCRIPTIONS | node dist/example-cli.js $ENDPOINT $API_KEY`

### Example

`echo '[{"topic":"trades","exchange":"bfnx","instrument_class":"spot","instrument":"btc-usd","data_version":"v1"},{"topic":"trades","exchange":"bfnx","instrument_class":"spot","instrument":"eth-eur","data_version":"v1"}]' | node dist/example-cli.js wss://eu-beta.market-ws.kaiko.io/v1 1337DEADBEEF`
