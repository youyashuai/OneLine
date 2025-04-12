"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ApiConfig } from '@/types';
import { getEnvApiEndpoint, getEnvApiKey, getEnvApiModel, isUserConfigAllowed } from '@/lib/env';

interface ApiContextType {
  apiConfig: ApiConfig;
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  isConfigured: boolean;
  allowUserConfig: boolean;
}

const defaultApiConfig: ApiConfig = {
  endpoint: '',
  model: 'gemini-2.0-flash-exp-search',
  apiKey: '',
  allowUserConfig: true,
};

const ApiContext = createContext<ApiContextType>({
  apiConfig: defaultApiConfig,
  updateApiConfig: () => {},
  isConfigured: false,
  allowUserConfig: true,
});

export const useApi = () => useContext(ApiContext);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [apiConfig, setApiConfig] = useState<ApiConfig>(defaultApiConfig);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [allowUserConfig, setAllowUserConfig] = useState<boolean>(true);

  // 初始化API配置，优先使用环境变量，然后是localStorage
  useEffect(() => {
    try {
      // 检查是否允许用户配置
      const userConfigAllowed = isUserConfigAllowed();
      setAllowUserConfig(userConfigAllowed);

      // 获取环境变量配置
      const envEndpoint = getEnvApiEndpoint();
      const envModel = getEnvApiModel();
      const envApiKey = getEnvApiKey();

      // 初始化配置对象
      let initialConfig: ApiConfig = { ...defaultApiConfig };

      // 如果环境变量中有配置，优先使用环境变量
      if (envEndpoint) initialConfig.endpoint = envEndpoint;
      if (envModel) initialConfig.model = envModel;
      if (envApiKey) initialConfig.apiKey = envApiKey;
      initialConfig.allowUserConfig = userConfigAllowed;

      // 如果允许用户配置，尝试从localStorage加载
      if (userConfigAllowed) {
        const storedConfig = localStorage.getItem('oneLine_apiConfig');
        if (storedConfig) {
          const parsedConfig = JSON.parse(storedConfig);
          
          // 合并配置，环境变量优先级高于localStorage
          initialConfig = {
            endpoint: envEndpoint || parsedConfig.endpoint || '',
            model: envModel || parsedConfig.model || defaultApiConfig.model,
            apiKey: envApiKey || parsedConfig.apiKey || '',
            allowUserConfig: userConfigAllowed,
          };
        }
      }

      // 更新状态
      setApiConfig(initialConfig);
      setIsConfigured(!!initialConfig.endpoint && !!initialConfig.apiKey);
    } catch (error) {
      console.error('Failed to initialize API config:', error);
    }
  }, []);

  const updateApiConfig = (config: Partial<ApiConfig>) => {
    // 如果不允许用户配置，则不更新
    if (!allowUserConfig) return;

    setApiConfig(prev => {
      const newConfig = { ...prev, ...config };
      
      // 保存到localStorage
      localStorage.setItem('oneLine_apiConfig', JSON.stringify(newConfig));
      
      // 更新isConfigured状态
      setIsConfigured(!!newConfig.endpoint && !!newConfig.apiKey);
      return newConfig;
    });
  };

  return (
    <ApiContext.Provider value={{ apiConfig, updateApiConfig, isConfigured, allowUserConfig }}>
      {children}
    </ApiContext.Provider>
  );
}
