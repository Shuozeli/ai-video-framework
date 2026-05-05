# MiniMax T2A (同步语音合成) API

> 使用本接口，在HTTP网络通信协议下进行同步语音合成。

**备用接口地址**: `https://api-bj.minimaxi.com/v1/t2a_v2`

## API Endpoint

```
POST https://api.minimaxi.com/v1/t2a_v2
```

## Authentication

HTTP Bearer Auth - API Key 在 [账户管理 > 接口密钥](https://platform.minimaxi.com/user-center/basic-information/interface-key) 中查看。

---

## Request

**Headers**:
| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | `application/json` |

**Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | 模型版本: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo` |
| text | string | Yes | 合成文本，最大 10000 字符。若文本长度大于 3000 字符，推荐使用流式输出 |
| stream | boolean | No | 是否流式输出，默认 false |
| voice_setting | object | Yes | 音色设置 (见下表) |
| audio_setting | object | No | 音频设置 (见下表) |
| pronunciation_dict | object | No | 发音标注 |
| subtitle_enable | boolean | No | 是否开启字幕，默认 false |
| output_format | string | No | 输出格式: `url` 或 `hex`，默认 `hex` (仅非流式) |
| aigc_watermark | boolean | No | 是否添加音频节奏标识，默认 false (仅非流式) |

### voice_setting

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| voice_id | string | Yes | 音色ID (见音色列表) |
| speed | number | No | 语速 [0.5, 2]，默认 1.0 |
| vol | number | No | 音量 (0, 10]，默认 1.0 |
| pitch | integer | No | 语调 [-12, 12]，默认 0 |
| emotion | string | No | 情绪: `happy`, `sad`, `angry`, `fearful`, `disgusted`, `surprised`, `calm`, `fluent`, `whisper` |

### audio_setting

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sample_rate | integer | No | 采样率: 8000, 16000, 22050, 24000, 32000, 44100，默认 32000 |
| bitrate | integer | No | 比特率: 32000, 64000, 128000, 256000，默认 128000 |
| format | string | No | 格式: `mp3`, `pcm`, `flac`, `wav`，默认 `mp3` |
| channel | integer | No | 声道数: 1 或 2，默认 1 |

---

## Response

### 非流式响应

```json
{
  "data": {
    "audio": "<hex编码的audio>",
    "status": 2
  },
  "extra_info": {
    "audio_length": 9900,
    "audio_sample_rate": 32000,
    "audio_size": 160323,
    "bitrate": 128000,
    "word_count": 52,
    "usage_characters": 26,
    "audio_format": "mp3",
    "audio_channel": 1
  },
  "trace_id": "01b8bf9bb7433cc75c18eee6cfa8fe21",
  "base_resp": {
    "status_code": 0,
    "status_msg": "success"
  }
}
```

### 流式响应 (SSE)

```json
{"data": {"audio": "hex编码的audio_chunk1", "status": 1}, "trace_id": "...", "base_resp": {"status_code": 0, "status_msg": ""}}
{"data": {"audio": "hex编码的audio_chunk2", "status": 1}, "trace_id": "...", "base_resp": {"status_code": 0, "status_msg": ""}}
{"data": {"audio": "hex编码的audio", "status": 2}, "extra_info": {...}, "trace_id": "...", "base_resp": {"status_code": 0, "status_msg": "success"}}
```

### status 状态码

- `1`: 合成中
- `2`: 合成结束

### base_resp status_code

| Code | Description |
|------|-------------|
| 0 | 成功 |
| 1000 | 未知错误 |
| 1001 | 超时 |
| 1002 | 触发限流 |
| 1004 | 鉴权失败 |
| 1039 | 触发 TPM 限流 |
| 1042 | 非法字符超过 10% |
| 2013 | 输入参数信息不正常 |

---

## 系统音色列表

### 中文

| voice_id | Name |
|----------|------|
| moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85 | - |
| moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d | - |
| Chinese (Mandarin)_Lyrical_Voice | - |
| Chinese (Mandarin)_HK_Flight_Attendant | - |

### 英文

| voice_id | Name |
|----------|------|
| English_Graceful_Lady | - |
| English_Insightful_Speaker | - |
| English_radiant_girl | - |
| English_Persuasive_Man | - |
| English_Lucky_Robot | - |

### 日文

| voice_id | Name |
|----------|------|
| Japanese_Whisper_Belle | - |
| moss_audio_24875c4a-7be4-11f0-9359-4e72c55db738 | - |
| moss_audio_7f4ee608-78ea-11f0-bb73-1e2a4cfcd245 | - |

---

## 特殊标签

### 停顿控制

在文本中增加 `<#x#>` 标记，`x` 为停顿时长（秒），范围 [0.01, 99.99]。

```
今天天气真好<#1.5#>我们走吧
```

### 语气词标签

仅 `speech-2.8-hd` 或 `speech-2.8-turbo` 模型支持：

| Tag | Description |
|-----|-------------|
| `(laughs)` | 笑声 |
| `(chuckle)` | 轻笑 |
| `(coughs)` | 咳嗽 |
| `(clear-throat)` | 清嗓子 |
| `(groans)` | 呻吟 |
| `(breath)` | 正常换气 |
| `(pant)` | 喘气 |
| `(sighs)` | 叹气 |
| `(snorts)` | 喷鼻息 |
| `(burps)` | 打嗝 |
| `(lip-smacking)` | 咂嘴 |
| `(humming)` | 哼唱 |
| `(hissing)` | 嘶嘶声 |
| `(emm)` | 嗯 |
| `(sneezes)` | 喷嚏 |

---

## 示例代码

### 非流式

```bash
curl -X POST 'https://api.minimaxi.com/v1/t2a_v2' \
  -H 'Authorization: Bearer $YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "speech-2.8-hd",
    "text": "今天是不是很开心呀(laughs)，当然了！",
    "stream": false,
    "voice_setting": {
      "voice_id": "male-qn-qingse",
      "speed": 1,
      "vol": 1,
      "pitch": 0,
      "emotion": "happy"
    },
    "audio_setting": {
      "sample_rate": 32000,
      "bitrate": 128000,
      "format": "mp3",
      "channel": 1
    }
  }'
```

### 流式

```bash
curl -X POST 'https://api.minimaxi.com/v1/t2a_v2' \
  -H 'Authorization: Bearer $YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "speech-2.8-hd",
    "text": "今天是不是很开心呀(laughs)，当然了！",
    "stream": true,
    "voice_setting": {
      "voice_id": "male-qn-qingse",
      "speed": 1,
      "vol": 1,
      "pitch": 0,
      "emotion": "happy"
    },
    "audio_setting": {
      "sample_rate": 32000,
      "bitrate": 128000,
      "format": "mp3",
      "channel": 1
    }
  }'
```

### 混合4种音色

```json
{
  "model": "speech-2.8-hd",
  "text": "今天天气真好",
  "voice_setting": {
    "voice_id": ""
  },
  "timbre_weights": [
    {"voice_id": "female-chengshu", "weight": 30},
    {"voice_id": "female-tianmei", "weight": 70}
  ]
}
```

---

## 声音效果器 (VoiceModify)

| Parameter | Range | Description |
|-----------|-------|-------------|
| pitch | [-100, 100] | 音高调整：-100更低沉，+100更明亮 |
| intensity | [-100, 100] | 强度调整：-100更刚劲，+100更轻柔 |
| timbre | [-100, 100] | 音色调整：-100更浑厚，+100更清脆 |
| sound_effects | string | 音效: `spacious_echo`, `auditorium_echo`, `lofi_telephone`, `robotic` |
