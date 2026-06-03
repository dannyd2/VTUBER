import type { Viseme } from '../types/avatar';

export class VisemeAnalyzer {
  private analyser: AnalyserNode;
  private freqBuf: ArrayBuffer;
  private timeBuf: ArrayBuffer;
  private prevViseme: Viseme = 'rest';
  private smoothVolume = 0;

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.freqBuf = new ArrayBuffer(analyser.frequencyBinCount);
    this.timeBuf = new ArrayBuffer(analyser.fftSize);
  }

  analyze(): { viseme: Viseme; volume: number } {
    const freqData = new Uint8Array(this.freqBuf);
    const timeData = new Uint8Array(this.timeBuf);
    this.analyser.getByteFrequencyData(freqData as unknown as Uint8Array<ArrayBuffer>);
    this.analyser.getByteTimeDomainData(timeData as unknown as Uint8Array<ArrayBuffer>);

    // RMS volume from time-domain data
    let rms = 0;
    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128;
      rms += v * v;
    }
    const volume = Math.sqrt(rms / timeData.length);
    this.smoothVolume = this.smoothVolume * 0.75 + volume * 0.25;

    if (this.smoothVolume < 0.015) {
      this.prevViseme = 'rest';
      return { viseme: 'rest', volume: 0 };
    }

    const normalizedVolume = Math.min(1, this.smoothVolume * 7);

    // Frequency bin ranges (assuming 44100 Hz sample rate, fftSize 256 → 128 bins, ~172 Hz/bin)
    const binCount = freqData.length;
    const avg = (lo: number, hi: number) => {
      let sum = 0;
      const n = hi - lo;
      for (let i = lo; i < hi && i < binCount; i++) sum += freqData[i];
      return sum / n / 255;
    };

    const bass    = avg(0,   Math.floor(binCount * 0.06));  // <~300Hz  (jaw)
    const low     = avg(Math.floor(binCount * 0.06), Math.floor(binCount * 0.15)); // 300–900 Hz
    const mid     = avg(Math.floor(binCount * 0.15), Math.floor(binCount * 0.35)); // 900–2k Hz
    const high    = avg(Math.floor(binCount * 0.35), Math.floor(binCount * 0.7));  // 2k–5k Hz

    let viseme: Viseme;

    // Classify based on spectral shape
    if (bass > 0.35 && low > 0.2) {
      viseme = 'aa';           // open vowel (A, AH)
    } else if (high > 0.25 && mid > 0.2 && bass < 0.2) {
      viseme = 'ee';           // front vowel (EE, EH)
    } else if (bass > 0.2 && low < 0.15 && mid < 0.1) {
      viseme = 'oo';           // rounded lip (OO, W)
    } else if (low > 0.15 && mid > 0.12) {
      viseme = 'oh';           // mid-open vowel (O, OH)
    } else if (high > 0.15 && bass < 0.1) {
      viseme = 'mm';           // nasal/fricative (M, N, F, S)
    } else {
      viseme = this.prevViseme === 'rest' ? 'aa' : this.prevViseme;
    }

    this.prevViseme = viseme;
    return { viseme, volume: normalizedVolume };
  }
}
