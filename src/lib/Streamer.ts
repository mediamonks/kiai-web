import { PipeSource } from './PipeSource';
import { IPipeDestination } from './IPipeDestination';

export type TResponse = {
  transcript?: string;
  intent?: string;
};

type TStreamerOptions = {
  host?: string;
  port?: number;
  projectId?: string;
  sampleRate?: number;
  languageCode?: string;
};

type TCommand = 'start' | 'stop';

type TPayload = { [key: string]: string | number };

const COMMAND: { [key: string]: TCommand } = {
  START: 'start',
  STOP: 'stop',
};

const defaultOptions: TStreamerOptions = {
  port: 6060,
  sampleRate: 44100,
  languageCode: 'en-US',
};

const reconnectTimeout = 2000;

export default class Streamer extends PipeSource implements IPipeDestination {
  private readonly url: string;
  private readonly projectId: string;
  private readonly sampleRate: number;
  private readonly languageCode: string;

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
    this.languageCode = options.languageCode;

    this.connect();
  }

  public get isOpen(): boolean {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  public receive(chunk: ArrayBuffer) {
    if (this.isOpen) {
      this.sendBuffer(chunk);
    }
  }

  public start() {
    this.sendCommand(COMMAND.START, {
      projectId: this.projectId,
      sampleRateHertz: this.sampleRate,
      languageCode: this.languageCode,
      context: '',
    });
  }

  public stop() {
    this.sendCommand(COMMAND.STOP);
  }

  public close() {
    if (this.isOpen) this.ws.close();
  }

  private connect() {
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

  private send(data: any) {
    if (this.isOpen) this.ws.send(data);
  }

  private sendCommand(command: TCommand, payload?: TPayload) {
    this.send(JSON.stringify({ command, payload }));
  }

  private sendBuffer(data: ArrayBuffer) {
    this.send(data);
  }
}
