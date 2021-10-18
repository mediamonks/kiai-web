import { IPipeDestination } from './types';

type TColor = [number, number, number];

type TSpectrumAnalyserOptions = {
	canvasElement?: HTMLCanvasElement;
	audioContext?: AudioContext;
	color?: TColor;
	thickness?: number;
};

export default class SpectrumAnalyser implements IPipeDestination {
	private readonly audioContext: AudioContext;
	private readonly analyser: AnalyserNode;
	private readonly canvasElement: HTMLCanvasElement;
	private readonly canvasContext: CanvasRenderingContext2D;
	private readonly color: TColor = [191, 191, 191];
	private readonly thickness: number = 3;

	constructor(options: TSpectrumAnalyserOptions) {
		if (!options.canvasElement) throw new Error('SpectrumAnalyser: canvasElement is required');

		this.canvasElement = options.canvasElement;
		this.canvasContext = this.canvasElement.getContext('2d');

		this.color = options.color || this.color;
		this.thickness = options.thickness || this.thickness;

		this.audioContext = options.audioContext || new AudioContext();
		this.analyser = this.audioContext.createAnalyser();
		this.analyser.fftSize = 2048;
		this.analyser.connect(this.audioContext.destination);
	}

	public receive(data: Float32Array): void {
		const yMiddle = this.canvasElement.height / 2;
		const canvasWidth = this.canvasElement.width;
		const bufferLength = data.length;

		this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

		data.forEach((value, index) => {
			const posX = (index / bufferLength) * canvasWidth;
			const posY = yMiddle + (value * yMiddle);

			const xMiddle = canvasWidth / 2;
			const opacity = 1 - (Math.abs(posX - xMiddle) / xMiddle);
			this.canvasContext.fillStyle = `rgba(${this.color.join(',')}, ${opacity})`;

			this.canvasContext.fillRect(posX, posY - ((this.thickness - 1) / 2), 1, this.thickness);
		});
	}
}
