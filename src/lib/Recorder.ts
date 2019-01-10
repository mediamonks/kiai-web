import { PipeSource } from './PipeSource';

type TRecorderOptions = {
  bufferSize?: number;
  sampleRate?: number;
  channelCount?: number;
};

const defaultOptions: TRecorderOptions = {
  bufferSize: 1024,
  sampleRate: 44100,
  channelCount: 1,
};

export default class Recorder extends PipeSource {
  private readonly audioContext: AudioContext;
  private readonly analyser: AnalyserNode;
  private readonly scriptProcessor: ScriptProcessorNode;

  private isRecording: boolean = false;

  constructor(options: TRecorderOptions = {}) {
    super();
    
    options = { ...defaultOptions, ...options };

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.scriptProcessor = this.audioContext.createScriptProcessor(options.bufferSize, 1, 1);
    this.isRecording = false;

    this.scriptProcessor.onaudioprocess = event => {
      if (this.isRecording) this.publish(event.inputBuffer.getChannelData(0));
    };

    this.scriptProcessor.connect(this.audioContext.destination);

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          sampleRate: options.sampleRate,
          channelCount: options.channelCount,
        },
      })
      .then(micStream => {
        const micSource = this.audioContext.createMediaStreamSource(micStream);
        micSource.connect(this.scriptProcessor);
        micSource.connect(this.analyser);
      })
      .catch(err => {
        console.error(err);
      });
  }

  public start() {
    this.isRecording = true;
  }

  public stop() {
    this.isRecording = false;
  }
}
