import nanoid from 'nanoid';
import PipeSource from './PipeSource';
import { IPipeDestination } from './types';

export type TResponse = {
  transcript?: string;
  intent?: string;
};

type TStreamerOptions = {
  host?: string;
  port?: number;
  projectId?: string;
  language?: string;
  sampleRate?: number;
};

type TCommand = 'start' | 'stop';

type TPayload = { [key: string]: string | number };

const COMMAND: { [key: string]: TCommand } = {
  START: 'start',
  STOP: 'stop',
};

const defaultOptions: TStreamerOptions = {
  port: 6060,
  language: 'en',
  sampleRate: 44100,
};

const reconnectTimeout = 2000;

export default class Streamer extends PipeSource implements IPipeDestination {
  private readonly url: string;
  private readonly projectId: string;
  private readonly sampleRate: number;

  private language: string;
  private ws: WebSocket;

  constructor(options: TStreamerOptions = {}) {
    super();

    options = { ...defaultOptions, ...options };

    if (!options.host) {
      throw new Error('Invalid streamer configuration: missing host');
    }

    if (!options.projectId) {
      throw new Error('Invalid streamer configuration: missing projectId');
    }

    this.url = `ws://${options.host}:${options.port}`;
    this.projectId = options.projectId;
    this.sampleRate = options.sampleRate;

    this.connect();
  }

  public get isOpen(): boolean {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  public receive(chunk: ArrayBuffer): void {
    if (this.isOpen) {
      this.sendBuffer(chunk);
    }
  }

  public start(): void {
    this.sendCommand(COMMAND.START, {
      sessionId: nanoid(), // TODO: generate on backend
      projectId: this.projectId,
      language: this.language,
      sampleRate: this.sampleRate,
    });
  }

  public stop(): void {
    this.sendCommand(COMMAND.STOP);
  }

  public close(): void {
    if (this.isOpen) this.ws.close();
  }
  
  public setLanguage(language: string): void {
    this.language = language;
  }

  private connect(): void {
    this.close();

    this.ws = new WebSocket(this.url);
    this.ws.binaryType = 'arraybuffer';
    this.ws.onmessage = message => {
      this.publish(JSON.parse(message.data) as TResponse);
    };

    this.ws.onerror = err => {
      console.error(err);
      this.close();
    };

    this.ws.onclose = () => {
      setTimeout(() => {
        this.connect();
      }, reconnectTimeout);
    };
  }

  private send(data: any): void {
    if (this.isOpen) this.ws.send(data);
  }

  private sendCommand(command: TCommand, payload?: TPayload): void {
    this.send(JSON.stringify({ command, payload }));
  }

  private sendBuffer(data: ArrayBuffer): void {
    this.send(data);
  }
}
