import ws = require('ws');
import { EventEmitter } from 'events';

const ENDPOINT = 'ws://127.0.0.1';
const API_KEY = '123';
interface WSError {
  error: any
  message: string
  type: string
  target: ws 
}

interface Subscription {
  topic: string
  exchange: string
  instrument_class: string
  instrument: string
  data_version?: string
}

interface TradeEntry {
  timestamp: number
  trade_id: string
  price: string
  amount: string
  taker_side_sell: boolean
}

interface SubscriptionInfo extends Subscription {
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

export class Client extends EventEmitter {
  public socket: ws;
  public subscriptions: SubscriptionInfo[];

  constructor(socket: ws) {
    super();
    this.socket = socket;
    this.socket.addEventListener('message', (event) => {
      const body = JSON.parse(event.data);
    })
  }
  
  private static isSubscribedMessage(message: ServerMessage): message is SubscribedMessage {
    return message.event === 'info' && message.payload.message === 'subscribed';
  }

  private static isUpdateMessage(message: ServerMessage): message is UpdateMessage {
    return message.event === 'update';
  }

  private static parseMessage(event: { data: ws.Data; type: string; target: ws }): ServerMessage {
    const body = typeof event.data === 'string'
      ? event.data
      : event.data.toString();
    const message: ServerMessage = JSON.parse(body);
    return message;
  }
  
  async subscribe(subscriptions: Subscription[]): Promise<SubscriptionInfo[]> {
    return new Promise<SubscriptionInfo[]>((resolve, reject) => {
      const command = {
        command: 'subscribe',
        args: { subscriptions }
      };
      const onSubscribedMessage = (event: { data: ws.Data; type: string; target: ws }) => {
        const message = Client.parseMessage(event)
        console.log('onMessage', message);
        if (Client.isSubscribedMessage(message)) {
          this.socket.removeEventListener('message', onSubscribedMessage);
          this.socket.addEventListener('message', onUpdateMessage);
          this.subscriptions = message.payload.subscriptions;
          resolve(message.payload.subscriptions);
        }
      };
      const onUpdateMessage = (event: { data: ws.Data; type: string; target: ws }) => {
        const message = Client.parseMessage(event)
        console.log('onUpdateMessage', message);
        if (Client.isUpdateMessage(message)) {
          this.emit('update', message.payload);
        }
      };
      this.socket.addEventListener('message', onSubscribedMessage);
      console.log('sending command', command);
      this.socket.send(JSON.stringify(command));
    });
  }
}

export const connect = async (endpoint: string, apiKey: string, onError: (event: WSError) => void): Promise<Client> => {
  return new Promise<Client>((resolve, reject) => {
    const socket = new ws(endpoint, ['api_key', apiKey]);
    socket.onopen = () => {
      socket.onerror = onError;
      const client = new Client(socket);
      resolve(client);
    };
    socket.onerror = (event) => {
      reject(event);
    };
  });
}
