## 动物图片 Animal API  - Quark API 文档

### 概述

Animal Recognition Dataset API 提供对结构化动物图片数据集的程序化访问服务。该数据集包含超过 9,700 张分类清晰的动物图片，涵盖家畜、宠物、家禽和人类等五大类别，共 17 个子类。所有图片可通过 GitHub 原始链接或 CDN 加速服务获取。

**Base URL:** `https://quark-api.lsqkk.space/api/animal`

所有响应均使用 JSON 格式，并遵循统一的响应结构。

### 统一响应结构

#### 成功响应
```json
{
  "success": true,
  "data": {
    // 端点特定的数据内容
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "request_id": "req_abc123def456",
    "endpoint": "/api/animal"
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested image was not found.",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z"
  }
}
```

### 认证与速率限制

当前版本为公开 API，无需认证。默认速率限制为每分钟 100 次请求。图片资源本身通过 GitHub 或公共 CDN 提供，不计入此限制。

### 核心概念

- **数据集源**: 所有图片托管于 GitHub 仓库 `lsqkk/animal-recognition-dataset`。
- **分类结构**: 数据按 `类别/子类/` 目录组织，例如 `dog/hashiqi/`。
- **图片命名**: 文件命名规则为 `{subcategory_id}_{sequence}.jpg`，例如 `hashiqi_42.jpg`。
- **图片ID**: 用于在 API 中唯一标识一张图片，格式为 `{subcategory_id}-{sequence}`，例如 `hashiqi-42`。
- **URL类型**: 支持 GitHub 原始链接和 jsDelivr CDN 链接（默认），后者提供全球加速和缩略图生成。

### 数据集类别概览

| 大类 (Category) | 子类 (Subcategory) | 中文名 | 图片数量 |
|-----------------|-------------------|--------|----------|
| cat | cat_mixed | 混合猫 | 579 |
| cat | jiafei | 加菲猫 | 255 |
| cat | jumao | 橘猫 | 772 |
| cat | sanhua | 三花猫 | 84 |
| dog | dog_mixed | 混合狗 | 995 |
| dog | fadou | 法斗 | 590 |
| dog | hashiqi | 哈士奇 | 890 |
| dog | jinmao | 金毛 | 634 |
| dog | keji | 柯基 | 682 |
| dog | samoye | 萨摩耶 | 1,139 |
| livestock | cattle | 牛 | 369 |
| livestock | horse | 马 | 224 |
| man | blackman | 黑人 | 798 |
| man | whiteman | 白人 | 745 |
| poultry | chicken | 鸡 | 367 |
| poultry | goose | 鹅 | 634 |

**统计摘要**：总计 5 个大类，17 个子类，9,757 张图片。

### 端点索引

#### 1. 获取服务信息
- `GET /api/animal` - 获取 API 概述与完整分类结构

#### 2. 分类信息
- `GET /api/animal/categories` - 获取所有分类或指定分类详情

#### 3. 图片获取
- `GET /api/animal/random` - 随机获取图片
- `GET /api/animal/{id}` - 按图片 ID 获取特定图片
- `GET /api/animal/range` - 获取指定子类的图片范围
- `GET /api/animal/search` - 根据关键词搜索图片

---

### 端点详情

#### GET /api/animal - 获取服务信息

返回 API 的完整描述，包括所有可用的分类、子类及其统计信息，是探索数据集的起点。

**请求参数**: 无

**响应示例**:
```json
{
  "success": true,
  "api": {
    "name": "Animal Recognition Dataset API",
    "version": "1.0.0",
    "base_url": "https://quark-api.lsqkk.space/api/animal",
    "description": "提供动物识别数据集的图片访问服务",
    "source": "https://github.com/lsqkk/animal-recognition-dataset"
  },
  "data": {
    "categories": [
      {
        "id": "dog",
        "name": "狗",
        "subcategories": [
          {
            "id": "hashiqi",
            "name": "哈士奇",
            "count": 890,
            "endpoints": {
              "random": "/api/animal/random?subcategory=hashiqi",
              "range": "/api/animal/range?subcategory=hashiqi",
              "browse": "/api/animal/hashiqi-1"
            }
          }
        ],
        "total": 4930,
        "endpoints": {
          "random": "/api/animal/random?category=dog",
          "browse": "/api/animal/categories/dog"
        }
      }
    ],
    "stats": {
      "total_categories": 5,
      "total_subcategories": 17,
      "total_images": 9757,
      "last_updated": "2024-01-21T12:00:00.000Z"
    },
    "image_urls": {
      "github_raw": "https://raw.githubusercontent.com/lsqkk/animal-recognition-dataset/main/{category}/{subcategory}/{filename}",
      "cdn": "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/{category}/{subcategory}/{filename}",
      "thumbnail": "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/{category}/{subcategory}/{filename}?width=300"
    }
  },
  "endpoints": {
    "categories": "GET /api/animal/categories - 获取分类详情",
    "random": "GET /api/animal/random - 随机获取图片",
    "by_id": "GET /api/animal/[subcategory_id]-[image_id] - 按ID获取图片",
    "search": "GET /api/animal/search - 搜索图片",
    "range": "GET /api/animal/range - 获取图片范围"
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "cache_hint": "分类信息缓存10分钟，建议客户端适当缓存"
  }
}
```

---

#### GET /api/animal/random - 随机获取图片

从整个数据集或按类别/子类筛选后，随机返回一张或多张图片的详细信息及访问链接。

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 描述 | 约束 |
|------|------|------|--------|------|------|
| `category` | String | 否 | - | 按大类筛选，如 `dog` | 必须为有效大类 ID |
| `subcategory` | String | 否 | - | 按子类筛选，如 `hashiqi` | 必须为有效子类 ID |
| `count` | Integer | 否 | 1 | 返回的图片数量 | 1-20 |
| `use_cdn` | Boolean | 否 | true | 是否返回 CDN 加速链接 | true/false |
| `include_info` | Boolean | 否 | true | 是否包含完整的图片元信息 | true/false |

**注意事项**：
- `category` 和 `subcategory` 参数不能同时使用。使用 `subcategory` 时，其所属的 `category` 会自动确定。
- 当 `include_info=false` 且 `count=1` 时，响应将简化为仅包含图片 URL、缩略图 URL 和 ID。

**示例请求**:
```
GET /api/animal/random?category=dog&count=2&use_cdn=false
```

**响应示例** (`include_info=true`):
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "hashiqi-42",
        "subcategoryId": "hashiqi",
        "categoryId": "dog",
        "filename": "hashiqi_42.jpg",
        "name": "哈士奇 42",
        "subcategoryName": "哈士奇",
        "categoryName": "狗",
        "index": 42,
        "url": "https://raw.githubusercontent.com/lsqkk/animal-recognition-dataset/main/dog/hashiqi/hashiqi_42.jpg",
        "thumbnail": "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/dog/hashiqi/hashiqi_42.jpg?width=300"
      }
    ],
    "count": 1,
    "filters": {
      "category": "dog",
      "subcategory": "all"
    },
    "url_type": "github_raw"
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z"
  }
}
```

---

#### GET /api/animal/{id} - 按 ID 获取图片

通过全局图片 ID 获取特定图片的详细信息。此端点功能灵活，支持直接重定向到图片或仅获取元信息。

**路径参数**:
- `id`: 图片的全局 ID，格式为 `{subcategory_id}-{sequence_number}`

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `use_cdn` | Boolean | 否 | true | 返回的链接使用 CDN 还是 GitHub 原始链接 |
| `redirect` | Boolean | 否 | false | 是否直接返回 302 重定向到图片 URL |
| `info_only` | Boolean | 否 | false | 是否仅返回图片元信息，不包含 `url` 和 `thumbnail` 字段 |

**模式说明**：
1.  **默认模式** (`redirect=false`, `info_only=false`): 返回包含完整图片信息、导航链接及访问 URL 的 JSON。
2.  **重定向模式** (`redirect=true`): 直接返回 302 状态码，将请求重定向到图片的实际 URL。此模式适用于 `<img src="...">` 标签。
3.  **信息模式** (`info_only=true`): 仅返回图片的元信息和导航信息，不包含直接的访问链接。

**示例请求**:
```
GET /api/animal/samoye-5?redirect=true
```
*(上述请求将直接返回 302 重定向到萨摩耶第 5 张图片的 CDN 地址)*

**响应示例** (默认模式):
```json
{
  "success": true,
  "data": {
    "id": "samoye-5",
    "subcategoryId": "samoye",
    "categoryId": "dog",
    "filename": "samoye_5.jpg",
    "name": "萨摩耶 5",
    "subcategoryName": "萨摩耶",
    "categoryName": "狗",
    "index": 5,
    "url": "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/dog/samoye/samoye_5.jpg",
    "thumbnail": "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/dog/samoye/samoye_5.jpg?width=300",
    "navigation": {
      "previous": "samoye-4",
      "next": "samoye-6",
      "current_position": 5,
      "total_images": 9757
    }
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "url_type": "cdn"
  }
}
```

---

#### GET /api/animal/search - 搜索图片

根据关键词在图片名称、子类名称或大类名称中进行搜索，并支持分页和筛选。

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 描述 | 约束 |
|------|------|------|--------|------|------|
| `q` | String | 是 | - | 搜索关键词 | 非空字符串 |
| `category` | String | 否 | - | 限定搜索的大类 | 有效大类 ID |
| `subcategory` | String | 否 | - | 限定搜索的子类 | 有效子类 ID |
| `limit` | Integer | 否 | 20 | 每页结果数 | 1-50 |
| `page` | Integer | 否 | 1 | 页码 | ≥1 |
| `use_cdn` | Boolean | 否 | true | 返回的链接使用 CDN 还是 GitHub 原始链接 | true/false |

**示例请求**:
```
GET /api/animal/search?q=金&category=dog&limit=5&page=1
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "query": "金",
    "results": [
      {
        "id": "jinmao-123",
        "subcategoryId": "jinmao",
        "categoryId": "dog",
        "filename": "jinmao_123.jpg",
        "name": "金毛 123",
        "subcategoryName": "金毛",
        "categoryName": "狗",
        "index": 123,
        "url": "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/dog/jinmao/jinmao_123.jpg",
        "thumbnail": "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/dog/jinmao/jinmao_123.jpg?width=300"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total_results": 634,
      "total_pages": 127,
      "has_next": true,
      "has_prev": false
    },
    "filters": {
      "category": "dog",
      "subcategory": "all"
    },
    "url_type": "cdn"
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "search_executed": true
  }
}
```

---

#### GET /api/animal/range - 获取图片范围

获取指定子类中一段连续序号范围内的图片。适用于需要批量获取同一子类图片的场景，如创建相册或滑块组件。

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 描述 | 约束 |
|------|------|------|--------|------|------|
| `subcategory` | String | 是 | - | 目标子类 ID | 必须为有效子类 ID |
| `start` | Integer | 否 | 0 | 起始索引（包含） | ≥0 |
| `end` | Integer | 否 | 10 | 结束索引（不包含） | >start, ≤start+50 |
| `use_cdn` | Boolean | 否 | true | 返回的链接使用 CDN 还是 GitHub 原始链接 | true/false |

**示例请求**:
```
GET /api/animal/range?subcategory=hashiqi&start=20&end=30
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "subcategory": "哈士奇",
    "category": "狗",
    "images": [
      {
        "id": "hashiqi-21",
        "filename": "hashiqi_21.jpg",
        "name": "哈士奇 21",
        "index": 21,
        "url": "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/dog/hashiqi/hashiqi_21.jpg",
        "thumbnail": "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/dog/hashiqi/hashiqi_21.jpg?width=300"
      }
    ],
    "range": {
      "start": 20,
      "end": 30,
      "count": 10,
      "has_more": true,
      "total_in_subcategory": 890
    }
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "url_type": "cdn"
  }
}
```

---

#### GET /api/animal/categories - 获取分类详情

获取所有分类的统计摘要或指定分类的详细信息。

**查询参数**:
| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `category` | String | 否 | - | 指定要查询详情的大类 ID |

**示例请求**:
```
GET /api/animal/categories
```
```
GET /api/animal/categories?category=dog
```

**响应示例** (查询所有分类):
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "dog",
        "name": "狗",
        "subcategory_count": 6,
        "image_count": 4930,
        "top_subcategories": [
          { "id": "samoye", "name": "萨摩耶", "count": 1139 },
          { "id": "dog_mixed", "name": "混合狗", "count": 995 },
          { "id": "hashiqi", "name": "哈士奇", "count": 890 }
        ]
      }
    ],
    "stats": {
      "total_categories": 5,
      "total_subcategories": 17,
      "total_images": 9757
    }
  },
  "meta": {
    "timestamp": "2024-01-21T10:30:00.000Z",
    "total_categories": 5
  }
}
```

### 客户端使用示例

#### 在网页中直接显示随机图片 (HTML/JS)
```html
<!-- 方式1: 使用重定向端点直接作为图片源 -->
<img src="https://quark-api.lsqkk.space/api/animal/samoye-5?redirect=true" alt="萨摩耶">

<!-- 方式2: 使用Fetch API获取信息后显示 -->
<script>
async function loadRandomDogImage() {
  const response = await fetch('https://quark-api.lsqkk.space/api/animal/random?category=dog&include_info=false');
  const data = await response.json();
  if (data.success) {
    const imgElement = document.getElementById('dog-image');
    imgElement.src = data.data.url;
    imgElement.alt = `图片ID: ${data.data.id}`;
  }
}
loadRandomDogImage();
</script>
```

#### 使用 Python 批量获取图片信息
```python
import requests

def get_images_by_range(subcategory, batch_size=10):
    all_images = []
    start = 0
    
    while True:
        url = f"https://quark-api.lsqkk.space/api/animal/range"
        params = {'subcategory': subcategory, 'start': start, 'end': start+batch_size}
        response = requests.get(url, params=params).json()
        
        if not response.get('success') or not response['data']['images']:
            break
            
        all_images.extend(response['data']['images'])
        
        if not response['data']['range']['has_more']:
            break
            
        start += batch_size
    
    return all_images

# 获取前50张哈士奇图片的信息
hashiqi_images = get_images_by_range('hashiqi', batch_size=10)
print(f"Fetched {len(hashiqi_images)} Husky images.")
```

### 错误代码参考

| 状态码 | 错误代码 | 描述 |
|--------|----------|------|
| 400 | INVALID_PARAMETER | 请求参数无效或格式错误（如 count>20） |
| 404 | RESOURCE_NOT_FOUND | 请求的图片、分类或子类不存在 |
| 405 | METHOD_NOT_ALLOWED | 请求方法不被允许 |
| 429 | RATE_LIMIT_EXCEEDED | 请求频率超过限制 |
| 500 | INTERNAL_SERVER_ERROR | 服务器内部错误 |

### 最佳实践

1.  **链接选择**：对于网页展示，强烈建议使用 **CDN 链接** (`use_cdn=true`)，以获得更快的加载速度和自动的缩略图支持 (`?width=300`)。
2.  **数据缓存**：分类结构信息 (`/api/animal` 和 `/api/animal/categories`) 会缓存 10 分钟，客户端应适当缓存以减少请求。
3.  **批量操作**：需要获取同一子类多张图片时，使用 `range` 端点比多次调用 `random` 或按 `id` 获取更高效。
4.  **图片嵌入**：若只需在 HTML 中显示单张图片，使用 **重定向模式** (`redirect=true`) 是最简洁高效的方式。
5.  **错误处理**：始终检查响应中的 `success` 字段，并对可能的 404 错误（如请求的图片 ID 超出范围）进行妥善处理。