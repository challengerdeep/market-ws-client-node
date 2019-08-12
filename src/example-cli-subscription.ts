// tslint:disable:no-console
import fs = require('fs');
import Client = require('./Client');
import { Subscription, TradeEntry } from './Client';

const entriesBySubscription: {[subscriptionID: string]: TradeEntry[]} = {};

const endpoint = process.argv[2];
const apiKey = process.argv[3];

const run = async () => {
  Client.connect(endpoint, apiKey)
    .then(client => {
      console.log('connected');
      client.on('error', e => console.error(e));
      client.on('subscribed', message => {
        console.log('subscribed', message.payload);
      });
      client.on('update', u => {
        entriesBySubscription[u.subscription.id] = (entriesBySubscription[u.subscription.id] || []).concat(u.data);
        console.log('update', u.subscription.exchange, u.subscription.instrument);
      });
    }).catch(e => console.error(e));
};

run().then(() => console.log('Subscribed')).catch(e => {console.log(e); });
