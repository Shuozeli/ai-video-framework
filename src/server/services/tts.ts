import type { AudioResult } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// ============================================
// MiniMax TTS Service
// ============================================

export interface TTSConfig {
  apiKey: string;
  baseUrl: string;
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  speed: number;
  vol: number;
  pitch: number;
  emotion: string;
  outputPath: string;
}

export class TTSService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: TTSConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Generate audio from text using MiniMax T2A API
   */
  async generateAudio(request: TTSRequest): Promise<AudioResult> {
    const { text, voiceId, speed, vol, pitch, emotion, outputPath } = request;

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/t2a_v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'speech-02-hd',
          text,
          stream: false,
          voice_setting: {
            voice_id: voiceId,
            speed,
            vol,
            pitch,
            emotion: emotion || 'neutral',
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: 'mp3',
            channel: 1,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`MiniMax TTS API error: ${response.status} - ${error}`);
      }

      // Check if response is JSON or binary audio
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        // Some APIs return JSON with a URL to the audio
        const data = await response.json() as { data?: { audio_url?: string } };
        if (data?.data?.audio_url) {
          // Download from URL
          const audioResponse = await fetch(data.data.audio_url);
          if (!audioResponse.ok) {
            throw new Error(`Failed to download audio: ${audioResponse.status}`);
          }
          const buffer = await audioResponse.arrayBuffer();
          fs.writeFileSync(outputPath, Buffer.from(buffer));
        }
      } else {
        // Binary audio data
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(outputPath, Buffer.from(buffer));
      }

      // Get audio duration (estimate from file size for MP3 at 128kbps)
      const stats = fs.statSync(outputPath);
      const audioLengthMs = Math.round((stats.size / 128000) * 8 * 1000);

      return {
        sceneName: path.basename(outputPath, '.mp3'),
        audioPath: outputPath,
        audioLengthMs,
      };
    } catch (error) {
      console.error('TTS generation failed:', error);
      throw error;
    }
  }

  /**
   * List available voices from MiniMax
   */
  async listVoices(): Promise<Array<{ id: string; name: string; language: string; gender: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/voices`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list voices: ${response.status}`);
      }

      const data = await response.json() as { voices?: Array<{ voice_id: string; name: string; language: string; gender: string }> };
      return (data.voices || []).map(v => ({ id: v.voice_id, name: v.name, language: v.language, gender: v.gender }));
    } catch (error) {
      console.error('List voices failed:', error);
      // Return default voices if API fails
      return [
        { id: 'male-qn-qingse', name: 'Male Qingse', language: 'zh-CN', gender: 'male' },
        { id: 'female-shaonv', name: 'Female Shaonv', language: 'zh-CN', gender: 'female' },
        { id: 'male-tianmei', name: 'Male Tianmei', language: 'zh-CN', gender: 'male' },
        { id: 'female-yunyang', name: 'Female Yunyang', language: 'zh-CN', gender: 'female' },
      ];
    }
  }
}
