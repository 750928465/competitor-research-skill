/**
 * 竞品研究 API（重构版）
 * 基于新的工作流引擎
 */

import { NextRequest, NextResponse } from 'next/server';
import { createResearchEngine, ProgressUpdate } from '@/lib/engine';
import { setLLMConfig } from '@/lib/llm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, initial_refs = [] } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '请提供有效的查询内容' },
        { status: 400 }
      );
    }

    // 从请求头或环境变量获取 API Key
    const tavilyKey = request.headers.get('X-Tavily-Key') || process.env.TAVILY_API_KEY;

    if (!tavilyKey) {
      return NextResponse.json(
        { error: '未检测到 Tavily API Key，请先配置您的密钥以启用竞品检索能力。' },
        { status: 401 }
      );
    }

    // 从请求头获取 LLM 配置（可选）
    const llmKey = request.headers.get('X-LLM-Key');
    const llmBaseUrl = request.headers.get('X-LLM-Base-Url');
    const llmModel = request.headers.get('X-LLM-Model');

    if (llmKey) {
      setLLMConfig({
        apiKey: llmKey,
        baseUrl: llmBaseUrl || 'https://api.openai.com/v1',
        model: llmModel || 'gpt-4o-mini',
      });
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // 后台执行工作流
    (async () => {
      try {
        const engine = createResearchEngine(tavilyKey, async (update: ProgressUpdate) => {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ type: 'progress', data: update })}\n\n`)
          );
        });

        const report = await engine.execute(query, initial_refs);

        // 发送完成事件
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'complete', data: report })}\n\n`)
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', data: errorMessage })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}