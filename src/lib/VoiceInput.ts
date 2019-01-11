import Recorder from './Recorder';
import Streamer from './Streamer';
import Converter from './Converter';
import Matcher from './Matcher';
import { IPipeDestination, TIntents } from './types';

type TVoiceInputOptions = {
  projectId: string;
  host: string;
  port?: number;
  language?: string;
  intents: TIntents;
  sampleRate?: number;
};

export default class VoiceInput implements IPipeDestination {
  private readonly recorder: Recorder;
  private readonly streamer: Streamer;
  private readonly converter: Converter;
  private readonly matcher: Matcher;

  private resolver: (intent: string) => void;

  constructor(options: TVoiceInputOptions) {
    this.recorder = new Recorder({
      sampleRate: options.sampleRate,
    });
    this.streamer = new Streamer({
      host: options.host,
      port: options.port,
      projectId: options.projectId,
      language: options.language,
      sampleRate: options.sampleRate,
    });
    this.converter = new Converter();
    this.matcher = new Matcher({
      intents: options.intents,
      language: options.language,
    });

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
    this.stopListening();
  }

  public stopListening(): void {
    this.recorder.stop();
    this.streamer.stop();
  }

  public setLanguage(language: string): void {
    this.streamer.setLanguage(language);
    this.matcher.setLanguage(language);
  }
}
