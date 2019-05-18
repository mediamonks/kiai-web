<template>
	<div>
		HOME
	</div>
</template>

<script>
	import Transcriber from '../lib/Transcriber';
	
	export default {
		name: 'Home',
		mounted() {
			const transcriber = new Transcriber({ language: 'hu-HU' });
			transcriber.pipe({
				receive: output => {
					Array.from(output).forEach(result => {
						console.log(result.transcript, result.confidence);
					});
					
					// if (!output.isFinal) return;
					
					// console.log(Array.from(output).sort((a, b) => a.confidence - b.confidence).pop());
				}
			});
			
			transcriber.start();
		}
	};
</script>

<style scoped>
</style>
