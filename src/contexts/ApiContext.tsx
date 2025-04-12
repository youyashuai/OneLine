"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { ApiConfig } from '@/types';

interface ApiContextType {
  apiConfig: ApiConfig;
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  isConfigured: boolean;
}

const defaultApiConfig: ApiConfig = {
  endpoint: '',
  model: 'gemini-2.0-flash-exp-search',
  apiKey: '',
};

const ApiContext = createContext<ApiContextType>({
  apiConfig: defaultApiConfig,
  updateApiConfig: () => {},
  isConfigured: false,
});

export const useApi = () => useContext(ApiContext);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [apiConfig, setApiConfig] = useState<ApiConfig>(defaultApiConfig);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  // Load API config from localStorage on mount
  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem('oneLine_apiConfig');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setApiConfig(parsedConfig);
        setIsConfigured(!!parsedConfig.endpoint && !!parsedConfig.apiKey);
      }
    } catch (error) {
      console.error('Failed to load API config from localStorage:', error);
    }
  }, []);

  const updateApiConfig = (config: Partial<ApiConfig>) => {
    setApiConfig(prev => {
      const newConfig = { ...prev, ...config };
      // Save to localStorage
      localStorage.setItem('oneLine_apiConfig', JSON.stringify(newConfig));
      // Update isConfigured state
      setIsConfigured(!!newConfig.endpoint && !!newConfig.apiKey);
      return newConfig;
    });
  };

  return (
    <ApiContext.Provider value={{ apiConfig, updateApiConfig, isConfigured }}>
      {children}
    </ApiContext.Provider>
  );
}
