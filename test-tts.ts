/**
 * TTS integration test — exercises the production TTSService.
 *
 * Usage:
 *   MINIMAX_API_KEY=<key> pnpm dlx tsx test-tts.ts
 *   MINIMAX_API_KEY=<key> MINIMAX_MODEL=speech-2.8-turbo pnpm dlx tsx test-tts.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { TTSService } from './src/server/services/tts';

const apiKey = process.env.MINIMAX_API_KEY;
const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimaxi.com';
const outDir = path.resolve(process.env.TTS_OUT_DIR || './test-output/tts');

if (!apiKey) {
  console.error('Error: MINIMAX_API_KEY env var is required.');
  console.error('Get one at https://platform.minimaxi.com/user-center/basic-information/interface-key');
  process.exit(1);
}

interface Sample {
  label: string;
  text: string;
  voiceId: string;
}

const samples: Sample[] = [
  {
    label: 'zh',
    text: '欢迎收看本期财经速递,今天我们关注英伟达的最新财报。',
    voiceId: process.env.TTS_VOICE_ID_ZH || 'audiobook_male_1',
  },
  {
    label: 'en',
    text: "Welcome to today's finance briefing. Nvidia reported earnings beating consensus.",
    voiceId: process.env.TTS_VOICE_ID_EN || 'English_Graceful_Lady',
  },
];

function isMp3(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  const isId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33;
  const isSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
  return isId3 || isSync;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Out dir:  ${outDir}\n`);

  const tts = new TTSService({ apiKey: apiKey! , baseUrl });

  let failed = 0;
  for (const s of samples) {
    const outPath = path.join(outDir, `${s.label}.mp3`);
    process.stdout.write(`[${s.label}] voice=${s.voiceId}  text="${s.text.slice(0, 32)}..."  → `);

    const t0 = Date.now();
    try {
      const result = await tts.generateAudio({
        text: s.text,
        voiceId: s.voiceId,
        speed: 1.0,
        vol: 1.0,
        pitch: 0,
        emotion: 'calm',
        outputPath: outPath,
      });
      const elapsed = Date.now() - t0;
      const buf = fs.readFileSync(outPath);
      const valid = isMp3(buf);

      console.log(
        `${valid ? '✓' : '✗'} ${fmtBytes(buf.length)}  ${result.audioLengthMs}ms audio  (${elapsed}ms wall)`,
      );

      const titlesPath = outPath.replace(/\.mp3$/, '.titles.json');
      const extraPath = outPath.replace(/\.mp3$/, '.extra.json');
      if (fs.existsSync(titlesPath)) console.log(`     titles: ${titlesPath}`);
      if (fs.existsSync(extraPath)) console.log(`     extra:  ${extraPath}`);

      if (!valid) {
        console.error(`  └─ ${outPath} doesn't look like a valid MP3`);
        failed++;
      }
    } catch (err) {
      console.log('✗ ERROR');
      console.error(`  └─ ${(err as Error).message}`);
      failed++;
    }
  }

  if (failed) {
    console.error(`\n${failed} of ${samples.length} sample(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${samples.length} samples generated. Inspect: ls -la ${outDir}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
