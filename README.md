# Quark API - 夸克博客个人 API 服务集合

Quark API 是一个模块化、可扩展的个人 API 服务集合，当前核心功能为提供多主题百科题库服务。项目采用 Node.js 开发，部署于 Vercel 平台，支持通过 RESTful API 访问丰富的问答数据。

## API文档

[夸克API Quark API](https://lsqkk.github.io/quarkdoc/QuarkAPI)

## 功能特性

- **多主题题库**: 提供计算机历史、科技公司 trivia 等多种主题的题库
- **灵活的查询方式**: 支持随机抽取、ID查询、范围查询和全文搜索
- **标准化响应**: 统一的JSON响应格式和错误处理机制
- **高性能设计**: 内置缓存机制，响应快速
- **跨域支持**: 完善的CORS配置，支持前端应用直接调用
- **易于扩展**: 模块化架构，便于添加新的API服务

## 技术栈

- **运行时**: Node.js 14+
- **部署平台**: Vercel
- **数据格式**: JSON
- **API风格**: RESTful

## 快速开始

### 环境要求

1. Node.js 14.0 或更高版本
2. Git
3. Vercel 账户（用于部署）

### 本地开发

1. 克隆仓库
```bash
git clone https://github.com/lsqkk/quark-api.git
cd quark-api
```

2. 安装依赖
```bash
npm install
```

3. 启动本地开发服务器
```bash
npm start
```

4. 访问本地服务
   - API根路径: http://localhost:3000/api
   - 健康检查: http://localhost:3000/api/health

### 项目结构

```
quark-api/
├── api/                    # API路由处理函数
│   ├── quiz/              # 题库相关端点
│   │   ├── index.js       # GET /api/quiz - 题库列表
│   │   ├── random.js      # GET /api/quiz/random - 随机题目
│   │   ├── search.js      # GET /api/quiz/search - 搜索题目
│   │   ├── [id].js        # GET /api/quiz/[id] - 按ID查询
│   │   └── range.js       # GET /api/quiz/range - 范围查询
│   ├── index.js           # GET /api - API信息
│   └── health.js          # GET /api/health - 健康检查
├── data/                  # 题库数据存储
│   ├── quizzes/           # 题库JSON文件
│   │   ├── ibm-trivia.json
│   │   ├── computer-history.json
│   │   └── ...
│   └── index/             # 题库索引文件
│       └── ti_index.json  # 自动生成的索引
├── lib/                   # 核心工具库
│   └── quiz-manager.js    # 题库管理核心逻辑
├── public/                # 静态资源
│   └── docs/              # API文档
│       └── index.html     # 文档页面
├── vercel.json            # Vercel部署配置
├── package.json           # 项目依赖配置
└── README.md              # 项目说明文档
```

## 部署指南

### 部署到 Vercel

1. 推送代码到GitHub仓库

2. 在Vercel控制台导入项目
   - 登录 [Vercel](https://vercel.com)
   - 点击"New Project"
   - 导入你的GitHub仓库 `quark-api`
   - 使用默认配置即可

3. 配置自定义域名（可选）
   - 在项目设置中添加自定义域名
   - 按照提示配置 DNS 记录

4. 自动部署
   - 每次推送到 `main` 分支会自动触发部署
   - 部署状态可在Vercel控制台查看

### 环境变量配置

如需配置环境变量，在Vercel项目设置中添加：

- `NODE_ENV`: 运行环境 (`production`/`development`)
- `DATA_PATH`: 数据目录路径（通常不需要修改）

## API使用示例[以Quiz API为例]

### 获取题库列表
```bash
curl https://quark-api.lsqkk.space/api/quiz
```

### 获取随机题目
```bash
curl "https://quark-api.lsqkk.space/api/quiz/random?count=3&source=computer-history"
```

### 搜索题目
```bash
curl "https://quark-api.lsqkk.space/api/quiz/search?q=IBM&limit=5"
```

### 获取特定题目
```bash
curl https://quark-api.lsqkk.space/api/quiz/ibm-trivia-15
```

## 添加新的题库

1. 准备题库JSON文件，格式如下：
```json
{
  "quiz_title": "你的题库标题",
  "description": "题库描述",
  "total_questions": 50,
  "questions_per_quiz": 10,
  "questions": [
    {
      "id": 1,
      "question": "问题内容",
      "options": [
        {"letter": "A", "text": "选项A", "is_correct": false},
        {"letter": "B", "text": "选项B", "is_correct": true}
      ],
      "correct_answer": "B"
    }
  ]
}
```

2. 将文件放入 `data/quizzes/` 目录，并更新索引`ti_index.json`

3. 推送更改到 GitHub ，部署后自动生效

## 开发指南

### 添加新的API模块

1. 在 `api/` 目录下创建新的端点文件
2. 遵循现有模式导出请求处理函数
3. 在 `vercel.json` 中配置路由（如有需要）
4. 更新根API端点 (`/api`) 的文档信息

### 本地测试

项目包含本地开发服务器，模拟Vercel环境：

```bash
# 启动开发服务器
npm start

# 直接测试API端点
curl http://localhost:3000/api/quiz
```

### 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

### 支持与联系

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [项目Issues页面](https://github.com/lsqkk/quark-api/issues)

### 致谢

感谢 Vercel 提供的无服务器部署支持。