# 题库测试 Quiz API - Quark API 文档

## 概述

Quark API Quiz 模块是一个提供多主题百科题库服务的 RESTful API。该服务支持随机抽取题目、按ID查询、范围查询以及全文搜索等功能，适用于构建问答应用、学习工具或娱乐项目。

**Base URL:** `https://quark-api.lsqkk.space/api`

所有响应均使用JSON格式，并遵循统一的响应结构。

## 统一响应结构

### 成功响应
```json
{
  "success": true,
  "data": {
    // 端点特定的数据
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "request_id": "req_abc123def456",
    "endpoint": "/api/quiz"
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested quiz was not found.",
    "details": {} // 可选，开发环境可见的详细信息
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z"
  }
}
```

## 认证与速率限制

当前版本为公开API，无需认证。默认速率限制为每分钟100次请求。建议在生产环境中合理控制请求频率，并缓存响应数据。

## 核心概念

- **题库 (Quiz)**: 一个独立的JSON文件，包含同一主题的多个题目，如 `ibm-trivia.json`。
- **题目 (Question)**: 题库中的一个具体问题，包含题干、选项和答案。
- **全局ID**: 标识特定题目的唯一字符串，格式为 `{quiz_id}-{question_id}`，例如 `ibm-trivia-15`。

## 端点索引

### 1. 获取API信息
- `GET /api` - 获取所有可用端点信息

### 2. 健康检查
- `GET /api/health` - 检查服务状态

### 3. 题库端点
- `GET /api/quiz` - 获取题库列表
- `GET /api/quiz/random` - 获取随机题目
- `GET /api/quiz/{id}` - 按ID获取特定题目
- `GET /api/quiz/range` - 获取题目范围
- `GET /api/quiz/search` - 搜索题目

## 端点详情

### GET /api/quiz - 获取题库列表

返回所有可用题库的元信息列表。

**请求参数**: 无

**响应示例**:
```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "id": "ibm-trivia",
        "title": "IBM公司知识问答",
        "description": "关于IBM创始人、计算机历史、大型机、个人电脑等问题的问答。",
        "stats": {
          "total": 60,
          "per_quiz": 20,
          "actual": 60
        },
        "file_info": {
          "name": "ibm-trivia.json",
          "size": 41800,
          "updated": "2026-01-21T11:59:54.089297"
        },
        "endpoints": {
          "self": "/api/quiz/ibm-trivia",
          "random": "/api/quiz/random?source=ibm-trivia",
          "range": "/api/quiz/range?quiz=ibm-trivia"
        }
      }
    ],
    "stats": {
      "total_quizzes": 3,
      "total_questions": 210,
      "avg_questions_per_quiz": 70
    }
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "request_id": "req_abc123def456"
  }
}
```

### GET /api/quiz/random - 获取随机题目

从所有题库或指定题库中随机返回题目。

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 描述 | 约束 |
|------|------|------|--------|------|------|
| `source` | String | 否 | - | 题库ID，如 `ibm-trivia` | 必须是有效的题库ID |
| `count` | Integer | 否 | 1 | 返回的题目数量 | 1-20 |
| `include_answers` | Boolean | 否 | false | 是否在响应中包含正确答案 | true/false |

**示例请求**:
```
GET /api/quiz/random?source=computer-history&count=3&include_answers=false
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": 1,
        "question": "第一台电子计算机ENIAC诞生于哪一年？",
        "options": [
          {"letter": "A", "text": "1936年"},
          {"letter": "B", "text": "1946年"},
          {"letter": "C", "text": "1956年"},
          {"letter": "D", "text": "1966年"}
        ],
        "source": "computer-history",
        "quiz_title": "计算机历史冷知识测验"
      }
    ],
    "count": 1,
    "source": "computer-history",
    "include_answers": false
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "total_available": 100
  }
}
```

### GET /api/quiz/{id} - 按ID获取特定题目

通过全局ID获取特定题目。

**路径参数**:
- `id`: 题目的全局ID，格式为 `{quiz_id}-{question_id}`

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `showAnswer` | Boolean | 否 | false | 是否显示正确答案 |
| `include_options` | Boolean | 否 | true | 是否包含选项信息 |

**示例请求**:
```
GET /api/quiz/ibm-trivia-15?showAnswer=true
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "question": {
      "id": 15,
      "question": "IBM在哪个年份推出了第一台个人电脑IBM PC 5150？",
      "options": [
        {"letter": "A", "text": "1978年", "is_correct": false},
        {"letter": "B", "text": "1981年", "is_correct": true},
        {"letter": "C", "text": "1984年", "is_correct": false},
        {"letter": "D", "text": "1987年", "is_correct": false}
      ],
      "correct_answer": "B",
      "source": "ibm-trivia",
      "quiz_title": "IBM公司知识问答",
      "quiz_description": "IBM公司知识问答：通过我们包含关于IBM创始人、计算机历史、大型机、个人电脑等问题的IBM公司系列问答，来测试您对这家百年科技巨头的了解程度！"
    },
    "navigation": {
      "previous": "ibm-trivia-14",
      "next": "ibm-trivia-16",
      "total_in_quiz": 60,
      "current_position": 15
    }
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "requested_with_answers": true,
    "include_options": true
  }
}
```
### GET /api/quiz/range - 获取题目范围

获取指定题库中特定范围内的连续题目。

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 描述 | 约束 |
|------|------|------|--------|------|------|
| `quiz` | String | 是 | - | 题库ID | 必须是有效的题库ID |
| `start` | Integer | 否 | 0 | 起始索引（包含） | ≥0 |
| `end` | Integer | 否 | 10 | 结束索引（不包含） | >start, ≤start+50 |
| `include_answers` | Boolean | 否 | false | 是否包含答案 | true/false |

**示例请求**:
```
GET /api/quiz/range?quiz=computer-history&start=5&end=15&include_answers=false
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "computer-history",
      "title": "计算机历史冷知识测验",
      "description": "包含50+个关于先驱人物、创新技术、里程碑事件和技术发展历程的问题！",
      "total_questions": 100
    },
    "questions": [
      {
        "id": 5,
        "question": "谁被称为'现代计算机之父'？",
        "options": [
          {"letter": "A", "text": "艾伦·图灵"},
          {"letter": "B", "text": "约翰·冯·诺依曼"},
          {"letter": "C", "text": "查尔斯·巴贝奇"},
          {"letter": "D", "text": "比尔·盖茨"}
        ],
        "source": "computer-history",
        "quiz_title": "计算机历史冷知识测验"
      }
    ],
    "range": {
      "start": 5,
      "end": 15,
      "count": 10,
      "has_more": true
    }
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "include_answers": false
  }
}
```

### GET /api/quiz/search - 搜索题目

在所有题库或指定题库中搜索包含特定关键词的题目。

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 描述 | 约束 |
|------|------|------|--------|------|------|
| `q` | String | 是 | - | 搜索关键词 | 非空字符串 |
| `source` | String | 否 | - | 限定搜索的题库ID | 有效的题库ID |
| `limit` | Integer | 否 | 10 | 每页结果数 | 1-50 |
| `page` | Integer | 否 | 1 | 页码 | ≥1 |
| `include_answers` | Boolean | 否 | false | 是否包含答案 | true/false |

**示例请求**:
```
GET /api/quiz/search?q=计算机&limit=5&page=1
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "query": "计算机",
    "results": [
      {
        "id": 1,
        "question": "第一台电子计算机ENIAC诞生于哪一年？",
        "options": [
          {"letter": "A", "text": "1936年"},
          {"letter": "B", "text": "1946年"},
          {"letter": "C", "text": "1956年"},
          {"letter": "D", "text": "1966年"}
        ],
        "source": "computer-history",
        "quiz_title": "计算机历史冷知识测验",
        "global_id": "computer-history-1"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total_results": 12,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    },
    "filters": {
      "source": "all",
      "include_answers": false
    }
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "search_time_ms": 45
  }
}
```

## 错误代码参考

| 状态码 | 错误代码 | 描述 |
|--------|----------|------|
| 400 | INVALID_PARAMETER | 请求参数无效或格式错误 |
| 404 | RESOURCE_NOT_FOUND | 请求的题库或题目不存在 |
| 405 | METHOD_NOT_ALLOWED | 请求方法不被允许 |
| 429 | RATE_LIMIT_EXCEEDED | 请求频率超过限制 |
| 500 | INTERNAL_SERVER_ERROR | 服务器内部错误 |
| 503 | SERVICE_UNAVAILABLE | 服务暂时不可用 |

## 客户端使用示例

### JavaScript Fetch API
```javascript
// 获取随机题目
async function getRandomQuestion() {
  try {
    const response = await fetch('https://quark-api.lsqkk.space/api/quiz/random?count=2');
    const data = await response.json();
    
    if (data.success) {
      console.log('获取到的题目:', data.data.questions);
      return data.data.questions;
    } else {
      console.error('API错误:', data.error.message);
      return null;
    }
  } catch (error) {
    console.error('网络错误:', error);
    return null;
  }
}

// 搜索题目
async function searchQuestions(query, page = 1) {
  const url = new URL('https://quark-api.lsqkk.space/api/quiz/search');
  url.searchParams.set('q', query);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', 10);
  
  const response = await fetch(url);
  return await response.json();
}
```

### Python Requests
```python
import requests

def get_quiz_list():
    response = requests.get('https://quark-api.lsqkk.space/api/quiz')
    data = response.json()
    
    if data['success']:
        return data['data']['quizzes']
    else:
        print(f"错误: {data['error']['message']}")
        return []

def get_question_by_id(question_id, show_answer=False):
    params = {'showAnswer': 'true' if show_answer else 'false'}
    response = requests.get(f'https://quark-api.lsqkk.space/api/quiz/{question_id}', params=params)
    return response.json()
```

## 最佳实践

1. **缓存策略**: 对不常变的数据（如题库列表）实施客户端缓存，减少重复请求。
2. **错误处理**: 始终检查响应中的 `success` 字段，并对错误状态进行适当处理。
3. **分页使用**: 当处理大量结果时，使用分页参数避免单次请求数据量过大。
4. **请求限制**: 避免高频轮询，建议在需要时请求数据而非定时刷新。
5. **数据更新**: 题库内容更新后，API会自动生效，无需客户端更新。