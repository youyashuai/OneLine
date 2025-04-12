"use client";

import { useState, useEffect } from 'react';
import { useApi } from '@/contexts/ApiContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ApiSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiSettings({ open, onOpenChange }: ApiSettingsProps) {
  const { apiConfig, updateApiConfig, isConfigured, allowUserConfig } = useApi();
  const [endpoint, setEndpoint] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  // Update local state when apiConfig changes or dialog opens
  useEffect(() => {
    if (open) {
      setEndpoint(apiConfig.endpoint);
      setModel(apiConfig.model);
      setApiKey(apiConfig.apiKey);
    }
  }, [apiConfig, open]);

  const handleSave = () => {
    // 如果不允许用户配置，则直接关闭对话框
    if (!allowUserConfig) {
      onOpenChange(false);
      return;
    }

    // Validate inputs
    if (!endpoint.trim()) {
      setError('API端点不能为空');
      return;
    }

    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      setError('API端点需要以http://或https://开头');
      return;
    }

    if (!model.trim()) {
      setError('模型名称不能为空');
      return;
    }

    if (!apiKey.trim()) {
      setError('API密钥不能为空');
      return;
    }

    // Clear any previous errors
    setError('');

    // Update API config
    updateApiConfig({
      endpoint: endpoint.trim(),
      model: model.trim(),
      apiKey: apiKey.trim()
    });

    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md backdrop-blur-lg bg-background/90 border border-border/30 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle>API 设置</DialogTitle>
          <DialogDescription>
            {allowUserConfig 
              ? '配置用于生成时间轴的API接口信息' 
              : '当前使用环境变量配置，不允许用户修改API设置'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!allowUserConfig ? (
            <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
              管理员已通过环境变量配置API设置，不允许用户修改。如需更改，请联系管理员。
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="endpoint" className="sm:text-right">
                  API端点
                </Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="例如: https://example.com/v1/chat/completions"
                  className="sm:col-span-3 rounded-lg"
                  disabled={!allowUserConfig}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="model" className="sm:text-right">
                  模型名称
                </Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="例如: gemini-2.0-pro-exp-search"
                  className="sm:col-span-3 rounded-lg"
                  disabled={!allowUserConfig}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                <Label htmlFor="api-key" className="sm:text-right">
                  API密钥
                </Label>
                <Input
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API密钥"
                  type="password"
                  className="sm:col-span-3 rounded-lg"
                  disabled={!allowUserConfig}
                />
              </div>
              {error && (
                <div className="text-sm text-red-500 mt-2 text-center p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="sm:order-1 rounded-full">
            关闭
          </Button>
          {allowUserConfig && (
            <Button type="button" onClick={handleSave} className="sm:order-2 rounded-full">
              保存
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
