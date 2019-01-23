import d = require('debug');
import { EventEmitter } from 'events';
import ws = require('ws');

const debug = d('ws-client');

interface WSError {
  error: any
  message: string
  type: string
  target: ws
}

export interface Subscription {
  topic: string
  exchange: string
  instrument_class: string
  instrument: string
  data_version?: string
}

export interface TradeEntry {
  timestamp: number
  trade_id: string
  price: string
  amount: string
  taker_side_sell: boolean
}

export interface SubscriptionInfo extends Subscription {
  data_version: string
  id: string
}

interface ServerMessage {
  event: 'info' | 'error' | 'update'
  payload: any
}

interface SubscribedMessage extends ServerMessage {
  event: 'info'
  payload: {
    message: 'subscribed'
    subscriptions: SubscriptionInfo[]
  }
}

interface UpdateMessage extends ServerMessage {
  event: 'update'
  payload: {
    data_count: number
    subscription: SubscriptionInfo
    data: TradeEntry[]
  }
}

interface ErrorMessage extends ServerMessage {
  event: 'error'
  payload: {
    name: string
    message: string
  }
}

export class Client extends EventEmitter {

  private static isSubscribedMessage(message: ServerMessage): message is SubscribedMessage {
    return message.event === 'info' && message.payload.message === 'subscribed';
  }

  private static isUpdateMessage(message: ServerMessage): message is UpdateMessage {
    return message.event === 'update';
  }

  private static isErrorMessage(message: ServerMessage): message is ErrorMessage {
    return message.event === 'error';
  }

  private static parseMessage(event: { data: ws.Data; type: string; target: ws }): ServerMessage {
    const body = typeof event.data === 'string'
      ? event.data
      : event.data.toString();
    const message: ServerMessage = JSON.parse(body);
    return message;
  }
  public socket: ws;
  public subscriptions: SubscriptionInfo[];

  constructor(socket: ws) {
    super();
    this.socket = socket;
    this.socket.addEventListener('message', event => {
      this.onMessage(event);
    });
  }

  public async subscribe(subscriptions: Subscription[]): Promise<SubscriptionInfo[]> {
    return new Promise<SubscriptionInfo[]>((resolve, reject) => {
      const command = {
        command: 'subscribe',
        args: { subscriptions }
      };
      const onError = (message: ErrorMessage) => {
        this.removeListener('error', onError);
        this.removeListener('subscribed', onSubscribed);
        reject(message.payload);
      };
      const onSubscribed = (message: SubscribedMessage) => {
        this.subscriptions = message.payload.subscriptions;
        this.removeListener('error', onError);
        this.removeListener('subscribed', onSubscribed);
        resolve(message.payload.subscriptions);
      };
      this.addListener('subscribed', onSubscribed);
      this.addListener('error', onError);
      this.socket.send(JSON.stringify(command));
    });
  }

  private onMessage(event: { data: ws.Data; type: string; target: ws }) {
    const message = Client.parseMessage(event);
    debug('onMessage', message);
    if (Client.isSubscribedMessage(message)) {
      this.emit('subscribed', message);
    } else if (Client.isUpdateMessage(message)) {
      this.emit('update', message.payload);
    } else if (Client.isErrorMessage(message)) {
      this.emit('error', message);
    }
  }
}

export const connect = async (endpoint: string, apiKey: string, onSocketError: ((event: WSError) => void) = () => undefined): Promise<Client> => {
  return new Promise<Client>((resolve, reject) => {
    const socket = new ws(endpoint, ['api_key', apiKey]);
    socket.onopen = () => {
      socket.onerror = onSocketError;
      const client = new Client(socket);
      resolve(client);
    };
    socket.onerror = event => {
      reject(event);
    };
  });
};
