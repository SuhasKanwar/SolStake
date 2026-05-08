let clickAudioCtx: AudioContext | null = null;

export default function playUiClick() {
    try {
        const AudioContextImpl = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextImpl) return;

        if (!clickAudioCtx) clickAudioCtx = new AudioContextImpl();
        if (clickAudioCtx.state === "suspended") {
            void clickAudioCtx.resume();
        }

        const now = clickAudioCtx.currentTime;

        const sampleRate = clickAudioCtx.sampleRate;
        const durationSec = 0.018;
        const frameCount = Math.floor(sampleRate * durationSec);
        const buffer = clickAudioCtx.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < frameCount; i++) {
            const t = i / frameCount;
            const decay = Math.pow(1 - t, 3);
            data[i] = (Math.random() * 2 - 1) * decay;
        }

        const src = clickAudioCtx.createBufferSource();
        src.buffer = buffer;

        const bandpass = clickAudioCtx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.setValueAtTime(2200, now);
        bandpass.Q.setValueAtTime(1.4, now);

        const gain = clickAudioCtx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.32, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

        src.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(clickAudioCtx.destination);

        src.start(now);
        src.stop(now + durationSec);

        src.onended = () => {
            src.disconnect();
            bandpass.disconnect();
            gain.disconnect();
        };
    } catch {
    }
}