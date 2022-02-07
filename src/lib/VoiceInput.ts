/*
	Combines the Recorder, AmplitudeMeter, SignalTrigger, ChunkBuffer and Transcriber to provide a speech-to-text interface
 */
import range from 'lodash/range';
import clamp from 'lodash/clamp';
import PipeSource from './PipeSource';
import Recorder from './Recorder';
import SignalTrigger from './SignalTrigger';
import ChunkBuffer from './ChunkBuffer';
import Transcriber from './Transcriber';
import AmplitudeMeter from './AmplitudeMeter';
import { TAudioData } from './types';

type TVoiceInputOptions = {
	apiKey?: string,
	language?: string,
	inputThreshold?: number;
	silenceDelay?: number;
	timeout?: number;
	emitSpectrumAnalysis?: boolean;
	spectrumAnalysisBands?: number;
	spectrumAnalysisMinDecibels?: number;
	spectrumAnalysisMaxDecibels?: number;
};

export default class VoiceInput extends PipeSource {
	private readonly recorder: Recorder;
	private timeout: number;
	private inputDetected: boolean;
	protected readonly defaultOptions: TVoiceInputOptions = {
		language: 'en-US',
		inputThreshold: 0.1,
		silenceDelay: 500,
		timeout: 12000,
		spectrumAnalysisBands: 8,
		spectrumAnalysisMinDecibels: -110,
		spectrumAnalysisMaxDecibels: -70,
	};

	public constructor(options: TVoiceInputOptions) {
		super(options);

		const { apiKey, language, inputThreshold, silenceDelay, emitSpectrumAnalysis } = this.options as TVoiceInputOptions;

		this.recorder = new Recorder({ publishFrequencyData: emitSpectrumAnalysis });
		const buffer = new ChunkBuffer();
		const amplitudeMeter = new AmplitudeMeter();
		const inputTrigger = new SignalTrigger({ delay: 0, threshold: inputThreshold });
		const silenceTrigger = new SignalTrigger({ delay: silenceDelay, threshold: inputThreshold });
		const transcriber = new Transcriber({ apiKey, language });

		this.recorder.pipe(amplitudeMeter);

		amplitudeMeter.pipe(inputTrigger).pipe(inputState => {
			if (!inputState || this.inputDetected) return;
			this.inputDetected = true;
			window.clearTimeout(this.timeout);
		});

		amplitudeMeter.pipe(silenceTrigger).pipe(inputState => {
			if (inputState) return;
			if (this.inputDetected) {
				this.stop();
				buffer.flush();
			} else {
				buffer.clear();
			}
		});

		if (emitSpectrumAnalysis) {
			this.recorder.pipe(this.emitSpectrumAnalysis.bind(this));
		}

		this.recorder
			.pipe(buffer)
			.pipe(transcriber)
			.pipe(text => this.publish(text));
	}

	public async listen(): Promise<void> {
		const { timeout } = this.options as TVoiceInputOptions;
		await this.recorder.start();
		this.emit('started');
		this.timeout = window.setTimeout(() => this.stop(), timeout)
	}

	public stop(): void {
		this.recorder.stop();
		this.inputDetected = false;
		this.emit('stopped');
	}

	private emitSpectrumAnalysis({ frequency }: TAudioData) {
		const { spectrumAnalysisBands, spectrumAnalysisMinDecibels, spectrumAnalysisMaxDecibels } = this.options as TVoiceInputOptions;

		const { length } = frequency;
		const spectrum = [];
		const decibelRange = spectrumAnalysisMaxDecibels - spectrumAnalysisMinDecibels;
		let bandsRemaining = spectrumAnalysisBands;
		let offset = 0;
		while (bandsRemaining) {
			const bandWidth = (length - offset) / bandsRemaining;
			const averageDecibels = range(offset, offset + bandWidth).reduce((sum, index) => sum + frequency[index], 0) / bandWidth;
			const averageAmplitude = clamp((averageDecibels - spectrumAnalysisMinDecibels) / decibelRange, 0, 1);
			spectrum.push(averageAmplitude);
			offset += bandWidth;
			bandsRemaining--;
		}

		this.emit('spectrum', spectrum);
	}
}
