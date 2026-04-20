/**
 * LLM 服务 - 用于生成高质量分析内容
 */

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

let defaultConfig: LLMConfig | null = null;

export function setLLMConfig(config: LLMConfig) {
  defaultConfig = config;
}

export function getLLMConfig(): LLMConfig | null {
  // 优先使用设置的配置，否则从环境变量读取
  if (defaultConfig) return defaultConfig;

  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  if (!apiKey) return null;

  return { apiKey, baseUrl, model };
}

/**
 * 调用 LLM API 生成内容
 */
export async function generateWithLLM(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const config = getLLMConfig();
  if (!config) {
    throw new Error('LLM API Key 未配置，请设置 LLM_API_KEY 或 OPENAI_API_KEY 环境变量');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * 流式调用 LLM API
 */
export async function* streamWithLLM(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): AsyncGenerator<string> {
  const config = getLLMConfig();
  if (!config) {
    throw new Error('LLM API Key 未配置');
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API 错误: ${response.status} - ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}