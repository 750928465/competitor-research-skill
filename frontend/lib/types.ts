// 思考步骤详情类型
export interface ThinkingStepDetail {
  title: string;
  content: string;
  sources?: string[];
}

// 思考步骤
export interface ThinkingStep {
  id: string;
  text: string;
  status: 'pending' | 'active' | 'done';
  state?: string; // 所属状态阶段：IDENTIFYING, CRAWLING, CLEANING, ANALYZING, REPORTING
  detail?: ThinkingStepDetail;
  expanded?: boolean;
}

// 思考步骤分组
export interface ThinkingStepGroup {
  id: string;
  title: string;
  icon: string;
  color: string;
  steps: ThinkingStep[];
  status: 'pending' | 'active' | 'done';
}

// 应用状态类型
export type AppStatus = 'idle' | 'transitioning' | 'thinking' | 'generating' | 'done';

// 应用状态
export interface AppState {
  query: string;
  status: AppStatus;
  thinkingSteps: ThinkingStep[];
  result: string;
  error: string | null;
}

// Mock API 返回类型
export interface MockResponse {
  thinkingSteps: ThinkingStep[];
  result: string;
}

// 真实 API 响应类型
export interface ApiResponse {
  success: boolean;
  thinkingSteps?: ThinkingStep[];
  result?: string;
  error?: string;
}