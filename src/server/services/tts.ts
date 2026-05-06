import type { AudioResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// MiniMax TTS Service (async API)
//
// Three-step flow:
//   1. POST /v1/t2a_async_v2  → task_id
//   2. GET  /v1/query/t2a_async_query_v2?task_id=...  → poll until "Success"
//                                                       (yields file_id)
//   3. GET  /v1/files/retrieve_content?file_id=...
//      Response is a tar archive containing .mp3 + .titles + .extra
// ============================================

export interface TTSConfig {
  apiKey: string;
  baseUrl: string;
  /** MiniMax model. Defaults to 'speech-2.8-hd'. Override via MINIMAX_MODEL. */
  model?: string;
  /** Polling interval in ms. Default 2000. */
  pollIntervalMs?: number;
  /** Max wait in seconds before timing out. Default 300. */
  pollMaxSeconds?: number;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  speed: number;
  vol: number;
  pitch: number;
  emotion: string;
  outputPath: string;
  /** Per-request override of model (otherwise uses TTSConfig.model). */
  model?: string;
}

interface CreateTaskResponse {
  task_id?: string | number;
  task_token?: string;
  base_resp?: { status_code: number; status_msg?: string };
}

interface QueryTaskResponse {
  task_id?: string | number;
  status?: 'Processing' | 'Success' | 'Failed' | 'Expired' | string;
  file_id?: string | number;
  base_resp?: { status_code: number; status_msg?: string };
}

interface ExtraMetadata {
  audio_length?: number;
  audio_sample_rate?: number;
  audio_size?: number;
  bitrate?: number;
  vol?: number;
  word_count?: number;
}

// ============================================
// TTSService
// ============================================

export class TTSService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private pollIntervalMs: number;
  private pollMaxSeconds: number;

  constructor(config: TTSConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.defaultModel = config.model ?? process.env.MINIMAX_MODEL ?? 'speech-2.8-hd';
    this.pollIntervalMs = config.pollIntervalMs ?? 2000;
    this.pollMaxSeconds = config.pollMaxSeconds ?? 300;
  }

  async generateAudio(request: TTSRequest): Promise<AudioResult> {
    const { text, voiceId, speed, vol, pitch, emotion, outputPath } = request;
    const model = request.model ?? this.defaultModel;

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const taskId = await this.createTask({ text, model, voiceId, speed, vol, pitch, emotion });
    const fileId = await this.pollUntilReady(taskId);
    const tarBuf = await this.downloadFile(fileId);

    const entries = parseTar(tarBuf);

    const mp3Entry = entries.find((e) => e.name.endsWith('.mp3'));
    if (!mp3Entry) throw new Error('MiniMax response tar contained no .mp3 file');
    fs.writeFileSync(outputPath, mp3Entry.body);

    let audioLengthMs: number | undefined;
    const extraEntry = entries.find((e) => e.name.endsWith('.extra'));
    if (extraEntry) {
      try {
        const extra = JSON.parse(extraEntry.body.toString('utf-8')) as ExtraMetadata;
        audioLengthMs = extra.audio_length;
      } catch {
        // ignore parse failures; fall through to size-based estimate
      }
      const extraOut = outputPath.replace(/\.mp3$/, '.extra.json');
      fs.writeFileSync(extraOut, extraEntry.body);
    }

    const titlesEntry = entries.find((e) => e.name.endsWith('.titles'));
    if (titlesEntry) {
      const titlesOut = outputPath.replace(/\.mp3$/, '.titles.json');
      fs.writeFileSync(titlesOut, titlesEntry.body);
    }

    if (audioLengthMs === undefined) {
      // Estimate at 128 kbps = 16 KB/s
      audioLengthMs = Math.round((mp3Entry.body.length / 128000) * 8 * 1000);
    }

    return {
      sceneName: path.basename(outputPath, '.mp3'),
      audioPath: outputPath,
      audioLengthMs,
    };
  }

  // ------------------------------------------
  // Step 1: create task
  // ------------------------------------------

  private async createTask(req: {
    text: string;
    model: string;
    voiceId: string;
    speed: number;
    vol: number;
    pitch: number;
    emotion: string;
  }): Promise<string> {
    const url = `${this.baseUrl}/v1/t2a_async_v2`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: req.model,
        text: req.text,
        language_boost: 'auto',
        voice_setting: {
          voice_id: req.voiceId,
          speed: req.speed,
          vol: req.vol,
          pitch: req.pitch,
          emotion: req.emotion || 'calm',
        },
        audio_setting: {
          audio_sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
          channel: 1,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`MiniMax create-task HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const body = (await res.json()) as CreateTaskResponse;
    if (body.base_resp && body.base_resp.status_code !== 0) {
      throw new Error(
        `MiniMax create-task error ${body.base_resp.status_code}: ${
          body.base_resp.status_msg ?? ''
        }`,
      );
    }
    if (!body.task_id) {
      throw new Error(`MiniMax create-task: no task_id in response`);
    }
    return String(body.task_id);
  }

  // ------------------------------------------
  // Step 2: poll
  // ------------------------------------------

  private async pollUntilReady(taskId: string): Promise<string> {
    const start = Date.now();
    while (Date.now() - start < this.pollMaxSeconds * 1000) {
      const url = `${this.baseUrl}/v1/query/t2a_async_query_v2?task_id=${encodeURIComponent(
        taskId,
      )}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${this.apiKey}` } });
      if (!res.ok) {
        throw new Error(`MiniMax query HTTP ${res.status}`);
      }
      const body = (await res.json()) as QueryTaskResponse;

      if (body.status === 'Success' && body.file_id) {
        return String(body.file_id);
      }
      if (body.status === 'Failed' || body.status === 'Expired') {
        throw new Error(
          `MiniMax task ${body.status}: ${body.base_resp?.status_msg ?? 'no detail'}`,
        );
      }
      await sleep(this.pollIntervalMs);
    }
    throw new Error(`MiniMax task polling timeout after ${this.pollMaxSeconds}s`);
  }

  // ------------------------------------------
  // Step 3: download (tar archive)
  // ------------------------------------------

  private async downloadFile(fileId: string): Promise<Buffer> {
    const url = `${this.baseUrl}/v1/files/retrieve_content?file_id=${encodeURIComponent(fileId)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${this.apiKey}` } });
    if (!res.ok) throw new Error(`MiniMax download HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  // ------------------------------------------
  // Voice listing (optional — endpoint may or may not exist on async API)
  // ------------------------------------------

  async listVoices(): Promise<Array<{ id: string; name: string; language: string; gender: string }>> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/voices`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        voices?: Array<{ voice_id: string; name: string; language: string; gender: string }>;
      };
      return (data.voices || []).map((v) => ({
        id: v.voice_id,
        name: v.name,
        language: v.language,
        gender: v.gender,
      }));
    } catch {
      // Fallback to a few well-known voices if API isn't available on this plan.
      return [
        { id: 'audiobook_male_1', name: 'Audiobook Male 1', language: 'zh-CN', gender: 'male' },
        { id: 'audiobook_female_1', name: 'Audiobook Female 1', language: 'zh-CN', gender: 'female' },
        { id: 'English_Graceful_Lady', name: 'English Graceful Lady', language: 'en-US', gender: 'female' },
        { id: 'English_Persuasive_Man', name: 'English Persuasive Man', language: 'en-US', gender: 'male' },
      ];
    }
  }
}

// ============================================
// Helpers
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// Minimal tar parser
//
// Tar format (POSIX ustar):
//   Each file = 512-byte header + N×512 data blocks (zero-padded last block).
//   Header layout:
//     bytes [0..99]   filename (NUL-padded)
//     bytes [124..135] file size in octal ASCII (NUL-terminated)
//   End-of-archive: two consecutive 512-byte zero blocks.
// ============================================

interface TarEntry {
  name: string;
  body: Buffer;
}

function parseTar(buf: Buffer): TarEntry[] {
  const BLOCK = 512;
  const entries: TarEntry[] = [];
  let off = 0;

  while (off + BLOCK <= buf.length) {
    // End-of-archive: a zero block.
    if (buf[off] === 0) break;

    const nameRaw = buf.subarray(off, off + 100);
    const name = nameRaw.toString('utf-8').replace(/\0+$/, '');

    const sizeRaw = buf.subarray(off + 124, off + 124 + 12);
    const sizeStr = sizeRaw.toString('utf-8').replace(/[\0\s]+$/, '');
    const size = parseInt(sizeStr, 8);

    if (Number.isNaN(size)) {
      throw new Error(`tar: invalid size at offset ${off}: "${sizeStr}"`);
    }

    off += BLOCK;
    const body = buf.subarray(off, off + size);
    off += size;
    // Pad to next 512 boundary.
    const pad = (BLOCK - (size % BLOCK)) % BLOCK;
    off += pad;

    if (name && size > 0) {
      entries.push({ name, body: Buffer.from(body) });
    }
  }
  return entries;
}
