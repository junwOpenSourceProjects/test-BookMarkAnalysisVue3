# 书签分析管理系统

## 项目简介

**书签分析管理系统** 是一个基于 Nuxt 4 + Vue 3 构建的浏览器书签分析与管理前端应用。它帮助用户导入、整理、检索和分析大量浏览器书签，提供仪表盘统计、文件夹树状浏览、全量数据检索、高级资源管理以及 AI 分类等能力。

主要功能包括：

- **仪表盘**：展示总书签数、文件夹数、标签数及最近添加数量。
- **导入书签**：支持从 Chrome / Firefox / Edge 导出的 HTML/JSON 文件批量导入。
- **高级资源管理器**：以表格形式管理书签，支持搜索、分页、编辑、删除及 AI 自动分类。
- **树状文件夹浏览**：按文件夹层级可视化展示书签结构。
- **全量数据检索**：按关键词搜索书签，支持多种排序方式。
- **管家工具箱**：提供批量标签管理、失效链接检测、数据导出、重复检测、标签合并、数据清理等工具入口。

## 系统架构图

```mermaid
graph LR
    A[浏览器 / 用户] -->|访问| B[Nuxt 4 前端]
    B -->|Vue 3 组件 + @nuxt/ui| C[页面路由]
    C -->|useBookmarkApi| D[后端 API /api]
    D -->|CRUD / AI 分类| E[(数据库)]
    D -->|可选| F[外部 AI 服务]

    subgraph 前端层
        B
        C
    end

    subgraph 接口层
        D
    end

    subgraph 数据层
        E
        F
    end
```

## 技术栈

- **框架**：Nuxt 4
- **UI 框架**：Vue 3 + Vue Router
- **组件库**：@nuxt/ui v4
- **语言**：TypeScript
- **样式**：原生 CSS + MiniMax 设计系统变量
- **包管理器**：pnpm
- **协议**：AGPL-3.0

## 项目结构

```text
test-BookMarkAnalysisVue3/
├── app.vue                 # 应用根组件
├── nuxt.config.ts          # Nuxt 配置文件
├── package.json            # 依赖与脚本
├── tsconfig.app.json       # TypeScript 应用配置
├── tsconfig.node.json      # TypeScript Node 配置
├── design.md               # MiniMax 设计系统文档
├── LICENSE                 # AGPL-3.0 许可证
├── assets/
│   └── css/
│       └── main.css        # 全局样式与设计令牌
├── composables/
│   └── useBookmarkApi.ts   # 书签相关 API 封装
├── layouts/
│   └── default.vue         # 默认布局（导航栏 + 页脚）
└── pages/
    ├── index.vue           # 首页重定向到仪表盘
    ├── dashboard.vue       # 仪表盘统计页
    ├── import.vue          # 书签导入页
    ├── manager.vue         # 高级资源管理器
    ├── toolbox.vue         # 管家工具箱
    ├── tree.vue            # 树状文件夹浏览
    └── list.vue            # 全量数据检索
```

## 启动方式

### 环境要求

- Node.js 18+
- pnpm（推荐）

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

默认开发服务器地址为 `http://localhost:3000`。

### 构建生产版本

```bash
pnpm build
```

### 本地预览生产构建

```bash
pnpm preview
```

> 注意：本项目为前端工程，运行时需要配合后端 `/api` 服务提供数据接口。

## 开源协议

本项目采用 [AGPL-3.0](LICENSE) 开源协议。
