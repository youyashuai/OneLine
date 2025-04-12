import type { EnvConfig } from '@/types';

// 获取环境变量配置
export function getEnvConfig(): EnvConfig {
  return {
    NEXT_PUBLIC_API_ENDPOINT: process.env.NEXT_PUBLIC_API_ENDPOINT,
    NEXT_PUBLIC_API_MODEL: process.env.NEXT_PUBLIC_API_MODEL,
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY,
    NEXT_PUBLIC_ALLOW_USER_CONFIG: process.env.NEXT_PUBLIC_ALLOW_USER_CONFIG,
  };
}

// 检查是否允许用户配置API设置
export function isUserConfigAllowed(): boolean {
  const allowUserConfig = process.env.NEXT_PUBLIC_ALLOW_USER_CONFIG;
  // 如果环境变量未设置或设置为 "true"，则允许用户配置
  return allowUserConfig === undefined || allowUserConfig === "true";
}

// 获取环境变量中的API端点
export function getEnvApiEndpoint(): string | undefined {
  return process.env.NEXT_PUBLIC_API_ENDPOINT;
}

// 获取环境变量中的API模型
export function getEnvApiModel(): string | undefined {
  return process.env.NEXT_PUBLIC_API_MODEL;
}

// 获取环境变量中的API密钥
export function getEnvApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_API_KEY;
}
