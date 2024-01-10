class RecorderProcessor extends AudioWorkletProcessor {
	constructor() {
		super();

		this.port.onmessage = ({ data }) => {
			const { command } = data;
			if (command === 'start') return this.start();
			if (command === 'stop') this.stop();
		};
	}

	process(inputs) {
		if (!this.recording) return;

		this.port.postMessage(inputs[0][0]);

		return true;
	}

	start() {
		this.recording = true;
	}

	stop() {
		this.recording = false;
	}
}

registerProcessor('recorder-processor', RecorderProcessor);
