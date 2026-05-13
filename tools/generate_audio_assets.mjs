import fs from "node:fs";
import path from "node:path";

const sampleRate = 44100;
const root = path.resolve("assets/audio");
const musicDir = path.join(root, "music");
const sfxDir = path.join(root, "sfx");

for (const dir of [musicDir, sfxDir]) fs.mkdirSync(dir, { recursive: true });

function writeWav(file, samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  samples.forEach((sample, index) => {
    const value = Math.max(-1, Math.min(1, sample));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2);
  });
  fs.writeFileSync(file, buffer);
}

function tone(freq, duration, { volume = 0.45, attack = 0.01, release = 0.08, wave = "sine", glide = 0 } = {}) {
  const length = Math.floor(duration * sampleRate);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const progress = i / Math.max(1, length - 1);
    const f = freq + glide * progress;
    const phase = 2 * Math.PI * f * t;
    let value = Math.sin(phase);
    if (wave === "triangle") value = (2 / Math.PI) * Math.asin(Math.sin(phase));
    if (wave === "square") value = Math.sign(Math.sin(phase));
    if (wave === "saw") value = 2 * (t * f - Math.floor(0.5 + t * f));
    const env = Math.min(1, t / attack, (duration - t) / release);
    out[i] = value * volume * Math.max(0, env);
  }
  return out;
}

function mix(parts) {
  const length = Math.max(...parts.map(({ offset, samples }) => Math.floor(offset * sampleRate) + samples.length));
  const out = new Float32Array(length);
  for (const { offset, samples, gain = 1 } of parts) {
    const start = Math.floor(offset * sampleRate);
    for (let i = 0; i < samples.length; i += 1) out[start + i] += samples[i] * gain;
  }
  return normalize(out, 0.92);
}

function normalize(samples, target = 0.85) {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak <= target) return samples;
  const gain = target / peak;
  return Float32Array.from(samples, (sample) => sample * gain);
}

function noise(duration, { volume = 0.25, lowpass = 0.82 } = {}) {
  const length = Math.floor(duration * sampleRate);
  const out = new Float32Array(length);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    last = last * lowpass + (Math.random() * 2 - 1) * (1 - lowpass);
    const t = i / sampleRate;
    const env = Math.max(0, 1 - t / duration);
    out[i] = last * volume * env;
  }
  return out;
}

function makeMusic() {
  const bpm = 82;
  const beat = 60 / bpm;
  const chords = [
    [220, 277.18, 329.63],
    [196, 246.94, 293.66],
    [174.61, 220, 261.63],
    [196, 246.94, 329.63],
  ];
  const parts = [];
  const bars = 8;
  for (let bar = 0; bar < bars; bar += 1) {
    const chord = chords[bar % chords.length];
    const offset = bar * beat * 4;
    chord.forEach((freq, i) => {
      parts.push({ offset, samples: tone(freq, beat * 3.9, { volume: 0.09 / (i + 1), attack: 0.18, release: 0.45, wave: "triangle" }) });
      parts.push({ offset, samples: tone(freq * 2, beat * 3.9, { volume: 0.035, attack: 0.18, release: 0.55 }) });
    });
    for (let step = 0; step < 8; step += 1) {
      const note = chord[step % chord.length] * 2;
      parts.push({ offset: offset + step * beat * 0.5, samples: tone(note, beat * 0.42, { volume: 0.045, attack: 0.02, release: 0.16, wave: "triangle" }) });
    }
    parts.push({ offset, samples: tone(chord[0] / 2, beat * 3.6, { volume: 0.08, attack: 0.02, release: 0.35, wave: "sine" }) });
  }
  writeWav(path.join(musicDir, "lounge-loop.wav"), mix(parts));
}

const sfx = {
  "ui-click.wav": mix([{ offset: 0, samples: tone(660, 0.08, { volume: 0.22, release: 0.04 }) }, { offset: 0.035, samples: tone(990, 0.08, { volume: 0.14, release: 0.04 }) }]),
  "pickup.wav": mix([{ offset: 0, samples: tone(420, 0.12, { volume: 0.22, glide: 180, wave: "triangle" }) }]),
  "place.wav": mix([{ offset: 0, samples: tone(360, 0.09, { volume: 0.18, wave: "triangle" }) }, { offset: 0.06, samples: tone(520, 0.12, { volume: 0.16 }) }]),
  "merge.wav": mix([{ offset: 0, samples: tone(620, 0.14, { volume: 0.24, wave: "triangle" }) }, { offset: 0.08, samples: tone(840, 0.18, { volume: 0.2 }) }]),
  "full-tray.wav": mix([{ offset: 0, samples: tone(760, 0.18, { volume: 0.22 }) }, { offset: 0.1, samples: tone(980, 0.22, { volume: 0.18 }) }, { offset: 0.18, samples: tone(1240, 0.28, { volume: 0.16 }) }]),
  "level-up.wav": mix([{ offset: 0, samples: tone(520, 0.16, { volume: 0.2 }) }, { offset: 0.12, samples: tone(760, 0.18, { volume: 0.2 }) }, { offset: 0.26, samples: tone(1120, 0.32, { volume: 0.18 }) }]),
  "invalid.wav": mix([{ offset: 0, samples: tone(180, 0.16, { volume: 0.22, wave: "saw", glide: -60 }) }]),
  "trash.wav": mix([{ offset: 0, samples: noise(0.18, { volume: 0.22 }) }, { offset: 0.05, samples: tone(260, 0.12, { volume: 0.14, wave: "triangle" }) }]),
  "tongs.wav": mix([{ offset: 0, samples: tone(520, 0.08, { volume: 0.2, wave: "triangle" }) }, { offset: 0.07, samples: tone(620, 0.09, { volume: 0.16, wave: "triangle" }) }]),
  "refresh.wav": mix([{ offset: 0, samples: tone(700, 0.12, { volume: 0.18, glide: 180 }) }, { offset: 0.1, samples: tone(520, 0.16, { volume: 0.16, glide: 140 }) }]),
  "game-over.wav": mix([{ offset: 0, samples: tone(360, 0.18, { volume: 0.2, wave: "triangle" }) }, { offset: 0.16, samples: tone(240, 0.32, { volume: 0.2, wave: "triangle" }) }]),
};

makeMusic();
for (const [name, samples] of Object.entries(sfx)) writeWav(path.join(sfxDir, name), samples);

console.log(`Generated audio assets in ${root}`);
