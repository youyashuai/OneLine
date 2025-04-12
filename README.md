## 一线 (OneLine)

一线是一个热点事件时间轴分析工具，它可以帮助用户快速了解重大事件的发展脉络并提供AI辅助分析。[Demo站点](https://oneline.chengtx.me)
![image](https://github.com/user-attachments/assets/a16f198f-ee6d-4c6b-b212-00f212641cf0)

## 主要功能

- 根据用户输入的关键词，生成相关历史事件的时间轴
- 显示每个事件的时间、标题、描述和相关人物
- 时间筛选功能，可按不同时间范围筛选事件
- AI分析功能，提供事件的深入背景、过程、影响分析
- 标记事件信息来源，增强可信度

## 技术栈

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui 组件库

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 构建

```bash
# 构建生产版本
npm run build
```

## 配置

该应用需要配置外部AI API（如Google Gemini API或OpenAI API）才能正常工作。在使用前，点击右上角的"API设置"按钮，配置以下信息：

- API端点
- 模型名称
- API密钥
