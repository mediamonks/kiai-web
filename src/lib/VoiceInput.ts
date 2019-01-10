import Recorder from './Recorder';
import Streamer from './Streamer';
import { Converter } from './Converter';
import { IPipeDestination } from './IPipeDestination';
import Matcher from './Matcher';

type TVoiceInputOptions = {
  projectId: string;
  host: string;
  port?: number;
  intents: any; // TODO: TIntents
};

export default class VoiceInput implements IPipeDestination {
  private readonly recorder: Recorder;
  private readonly streamer: Streamer;
  private readonly converter: Converter;
  private readonly matcher: Matcher;

  private resolver: (intent: string) => void;

  constructor(options: TVoiceInputOptions) {
    this.recorder = new Recorder();
    this.streamer = new Streamer({
      host: options.host,
      port: options.port,
      projectId: options.projectId,
    });
    this.converter = new Converter();
    this.matcher = new Matcher(options.intents);

    this.recorder
      .pipe(this.converter)
      .pipe(this.streamer)
      .pipe(this.matcher)
      .pipe(this);
  }

  public listen(): Promise<string> {
    this.streamer.start();
    this.recorder.start();

    return new Promise(resolve => {
      this.resolver = resolve;
    });
  }

  public receive(intent: string): void {
    if (this.resolver) {
      this.resolver(intent);
      this.resolver = undefined;
    }
    this.stop();
  }

  public stop(): void {
    this.recorder.stop();
    this.streamer.stop();
  }
}
