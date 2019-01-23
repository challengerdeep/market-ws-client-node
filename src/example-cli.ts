// tslint:disable:no-console
import fs = require('fs');
import Client = require('./Client');
import { Subscription, SubscriptionInfo, TradeEntry } from './Client';

const entriesBySubscription: {[subscriptionID: string]: TradeEntry[]} = {};

const endpoint = process.argv[2];
const apiKey = process.argv[3];
const subscriptions: Subscription[] = JSON.parse(fs.readFileSync(0, 'utf-8'));

const run = async () => {
  Client.connect(endpoint, apiKey)
    .then(client => {
      console.log('connected');
      client.on('error', e => console.error(e));
      client.on('subscribed', message => {
        console.log('subscribed', message.payload.subscriptions);
        message.payload.subscriptions.forEach((sub: SubscriptionInfo) => {
          entriesBySubscription[sub.id] = [];
        });
      });
      client.on('update', u => {
        entriesBySubscription[u.subscription.id] = entriesBySubscription[u.subscription.id].concat(u.data);
        if (u.data_count !== entriesBySubscription[u.subscription.id].length) {
          console.error(`Mismatch of number of entries expected (${u.data_count}) vs received (${entriesBySubscription[u.subscription.id].length})`);
        }
        console.log('update', u.subscription.exchange, u.subscription.instrument, u.data_count);
      });
      return client.subscribe(subscriptions);
    }).catch(e => console.error(e));
};

run().then(() => console.log('Subscribed')).catch(e => {console.log(e); });
