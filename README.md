# kiai-web
## Data types
### Audio Data
`Float32Array` containing a chunk of time-domain data (amplitude over time), bound between -1 and 1.
### Frequency Data
`Float32Array` containing frequency data (amplitude over frequency), bound between -127 and 127
### Audio Buffer
`AudioBuffer` containing

## Nodes
### Recorder
Input: none
Output: Audio Data / Frequency Data (see `mode` option)
### Buffer
Input: Audio Data
Output: AudioBuffer
