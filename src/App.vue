<template>
	<div id="app" ref="app">
		APP
		<router-view/>
	</div>
</template>

<script>
	export default {
		name: 'App',
		methods: {
			resize() {
				const scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
				document.body.style.transform = `scale(${scale})`;
				this.$refs.app.style.top = ((window.innerHeight / scale - 900) / 2) + 'px';
				this.$refs.app.style.left = ((window.innerWidth / scale - 1600) / 2) + 'px';
			}
		},
		mounted() {
			window.addEventListener('resize', this.resize.bind(this));
			this.resize();
		}

	};
</script>

<style lang="scss">
</style>
