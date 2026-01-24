# 新建API模块标准指南 -  Quark API

## 概述

本文档提供在现有 Quark API 项目中新建 API 服务的标准化流程和最佳实践。适用于项目维护者或 AI 助手参考，确保新模块的一致性、可维护性和部署友好性。

## 核心原则

1. **单一函数原则**：每个 API 模块应尽量聚合到单个 Serverless Function 中
2. **配置驱动**：路由和功能通过统一配置管理
3. **一致性**：保持与现有 API 相同的响应格式和错误处理
4. **资源优化**：必须考虑 Vercel 免费计划限制（12个函数，已用4个）

## 项目结构标准

```
quark-api/
├── api/                    # API 路由入口
│   ├── {module-name}/     # 新模块目录
│   │   └── index.js       # 聚合入口（唯一必需文件）
│   ├── index.js           # 主API入口（需更新）
│   └── health.js          # 健康检查（保持不变）
├── lib/                   # 业务逻辑
│   └── {module}-manager.js # 新模块管理器
├── data/                  # 数据文件（可选）
│   └── {module}/         # 模块专属数据
├── public/               # 静态资源及 API 文档
└── vercel.json           # 部署配置
```

## 新建API模块完整流程

### 步骤1：确定模块需求
- 明确API功能范围和数据源
- 设计端点结构和参数
- 预估数据量和访问频率

### 步骤2：创建管理器模块 (lib/)
```javascript
// lib/{module}-manager.js 模板
class ModuleManager {
    constructor() {
        // 初始化配置、缓存等
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5分钟缓存
    }
    
    // 核心数据获取方法
    async getData(id, options = {}) {
        // 实现业务逻辑
    }
    
    // 数据验证和清理
    sanitizeData(data, options = {}) {
        // 数据清理逻辑
    }
    
    // 缓存管理
    async getWithCache(key, fetchFunction) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            return cached.data;
        }
        
        const data = await fetchFunction();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }
}

module.exports = new ModuleManager();
```

### 步骤3：创建聚合API入口 (api/{module}/index.js)
```javascript
// api/{module-name}/index.js 模板
const moduleManager = require('../../lib/{module}-manager');

module.exports = async function handler(req, res) {
    // 1. 基础响应头设置
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // 2. 处理预检请求
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }
    
    // 3. 方法限制
    if (req.method !== 'GET') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed'
        });
    }
    
    // 4. 解析URL路径
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const endpointIndex = pathSegments.indexOf('{module-name}') + 1;
    const endpoint = endpointIndex < pathSegments.length ? pathSegments[endpointIndex] : '';
    
    try {
        // 5. 路由分发
        switch (endpoint) {
            case 'random':
                await handleRandom(req, res, url.searchParams);
                break;
            case 'search':
                await handleSearch(req, res, url.searchParams);
                break;
            // 添加更多端点...
            default:
                // 检查是否是ID格式或使用主入口
                if (endpoint && /^{id-pattern}$/.test(endpoint)) {
                    await handleById(req, res, endpoint, url.searchParams);
                } else {
                    await handleMain(req, res, url.searchParams);
                }
        }
    } catch (error) {
        // 6. 统一错误处理
        handleError(res, error);
    }
};

// 7. 各端点处理函数
async function handleMain(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    try {
        const data = await moduleManager.getMainData();
        
        res.status(200).json({
            success: true,
            api: {
                name: "{API名称}",
                version: "1.0.0",
                base_url: `https://quark-api.lsqkk.space/api/{module-name}`
            },
            data: data,
            endpoints: {
                // 列出所有可用端点
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        handleError(res, error);
    }
}

// 8. 错误处理函数
function handleError(res, error) {
    console.error('API Error:', error);
    
    res.setHeader('Content-Type', 'application/json');
    
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Invalid') ? 400 : 500;
    
    res.status(statusCode).json({
        success: false,
        error: error.message,
        meta: { timestamp: new Date().toISOString() }
    });
}
```

### 步骤4：更新主API入口 (api/index.js)
```javascript
// 在原有 endpoints 对象中添加新模块
const response = {
    // ... 原有内容
    endpoints: {
        // ... 原有端点
        "{module-name}": {
            base: "/api/{module-name}",
            description: "{模块描述}",
            endpoints: {
                list: "GET /api/{module-name}",
                random: "GET /api/{module-name}/random",
                // 其他端点...
            }
        }
    }
};
```

### 步骤5：更新配置部署 (vercel.json)
应当在`"rewrites"`中添加：
```json
        {
            "source": "/api/{module-name}/:path*",
            "destination": "/api/{module-name}"
        }
```

### 步骤6：创建 API 文档 (api/{module}/README.md)
```md
# 模块中文名 {module} API - Quark API 文档
## 按照标准 API 文档配置撰写
```
并应当复制到`quarkdoc`项目中`/docs/QuarkAPI/{module-name} API.md`

## 关键注意事项

### 1. 路由设计最佳实践
- **扁平化结构**：尽量使用查询参数而非深层路径
- **语义化端点**：`/api/module/action` 而非 `/api/module/doSomething`
- **ID格式统一**：使用 `{resource}-{id}` 格式，如 `item-42`

### 2. 参数处理规范
```javascript
// 参数解析示例
function parseParams(params) {
    return {
        id: params.get('id'),
        limit: Math.min(parseInt(params.get('limit')) || 10, 50),
        page: Math.max(parseInt(params.get('page')) || 1, 1),
        // 布尔值参数
        includeDetails: params.get('include_details') === 'true'
    };
}
```

### 3. 响应格式标准
```json
{
    "success": true,
    "data": { /* 核心数据 */ },
    "meta": {
        "timestamp": "ISO时间戳",
        "request_id": "唯一请求ID",
        "pagination": { /* 分页信息 */ }
    }
}
```

### 4. 错误处理标准
- **400**：参数错误
- **404**：资源不存在
- **429**：请求过多（如需限流）
- **500**：服务器内部错误

### 5. 性能优化要点
- **缓存策略**：适当使用内存缓存减少重复计算
- **分页支持**：大数据集必须支持分页
- **CDN集成**：静态资源使用CDN加速
- **压缩响应**：Vercel自动处理

## 常见问题解决

### Q1: 路由返回404
1. 检查 `vercel.json` 的 `rewrites` 配置
2. 确认文件路径和命名正确
3. 查看部署日志确认函数构建成功

### Q2: Vercel函数数量超限
1. 聚合相关功能到单个文件中
2. 删除未使用的函数文件
3. 使用 `vercel ls` 查看当前函数数量

### Q3: CORS问题
1. 确保响应头包含 `Access-Control-Allow-Origin: *`
2. 正确处理 OPTIONS 预检请求
3. 检查 `vercel.json` 中的 headers 配置

### Q4: 环境变量使用
```javascript
// 在Vercel项目设置中配置环境变量
const apiKey = process.env.API_KEY;
const isProd = process.env.NODE_ENV === 'production';
```

## 测试清单

- [ ] 本地运行 `npm start` 测试基本功能
- [ ] 测试所有端点的成功和错误情况
- [ ] 验证响应格式符合标准
- [ ] 检查CORS头正确设置
- [ ] 确认缓存头合理设置
- [ ] 部署到Vercel测试环境
- [ ] 更新主API入口的文档
- [ ] 创建独立的API文档页面

## 快速启动模板

可在项目根目录创建 `templates/` 目录，存放以下模板文件：

1. `module-manager-template.js` - 管理器模板
2. `api-index-template.js` - API入口模板
3. `docs-template.html` - 文档模板

使用时复制模板并替换 `{placeholders}` 即可快速创建新模块。