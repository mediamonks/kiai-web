import { IPipeDestination } from './types';

type TColor = [number, number, number];

type TSpectrumAnalyserOptions = {
	canvasElement?: HTMLCanvasElement;
	color?: TColor;
	thickness?: number;
	minDecibels?: number;
	maxDecibels?: number;
};

export default class SpectrumAnalyser implements IPipeDestination {
	private readonly canvasElement: HTMLCanvasElement;
	private readonly canvasContext: CanvasRenderingContext2D;
	private readonly color: TColor = [191, 191, 191];
	private readonly thickness: number = 3;
	private readonly minDecibels: number = -100;
	private readonly maxDecibels: number = -30;

	constructor(options: TSpectrumAnalyserOptions) {
		if (!options.canvasElement) throw new Error('SpectrumAnalyser: canvasElement is required');

		this.canvasElement = options.canvasElement;
		this.canvasContext = this.canvasElement.getContext('2d');

		this.color = options.color || this.color;
		this.thickness = options.thickness || this.thickness;
	}

	private equalizeFrequency(frequency: number, highestNumber: number) {
		const positiveVal = frequency - this.minDecibels;
		const difference = Math.abs(this.minDecibels - this.maxDecibels);
		const equalizer = highestNumber / difference;
		return positiveVal * equalizer;
	};

	public receive(data: Float32Array): void {
		const yMiddle = this.canvasElement.height / 2;
		const formattedData = data.map(frequency => this.equalizeFrequency(frequency, yMiddle));
		const canvasWidth = this.canvasElement.width;
		const bufferLength = data.length;

		this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

		formattedData.forEach((value, index) => {
			const posX = (index / bufferLength) * canvasWidth;
			const posY = yMiddle - value;

			const xMiddle = canvasWidth / 2;
			const opacity = 1 - (Math.abs(posX - xMiddle) / xMiddle);
			this.canvasContext.fillStyle = `rgba(${this.color.join(',')}, ${opacity})`;

			this.canvasContext.fillRect(posX, posY, 1, this.thickness);
		});
	}
}
