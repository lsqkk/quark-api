const animalManager = require('../../lib/animal-manager');

module.exports = async function handler(req, res) {
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed',
            message: 'Only GET method is supported'
        });
    }

    try {
        const structure = await animalManager.getDatasetStructure();

        const response = {
            success: true,
            api: {
                name: "Animal Recognition Dataset API",
                version: "1.0.0",
                base_url: "https://quark-api.lsqkk.space/api/animal",
                description: "提供动物识别数据集的图片访问服务",
                source: "https://github.com/lsqkk/animal-recognition-dataset"
            },
            data: {
                categories: structure.categories.map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    subcategories: cat.subcategories.map(sub => ({
                        id: sub.id,
                        name: sub.name,
                        count: sub.count,
                        endpoints: {
                            random: `/api/animal/random?subcategory=${sub.id}`,
                            range: `/api/animal/range?subcategory=${sub.id}`,
                            browse: `/api/animal/${sub.id}-1` // 第一张图片
                        }
                    })),
                    total: cat.total,
                    endpoints: {
                        random: `/api/animal/random?category=${cat.id}`,
                        browse: `/api/animal/categories/${cat.id}`
                    }
                })),
                stats: structure.stats,
                image_urls: {
                    github_raw: "https://raw.githubusercontent.com/lsqkk/animal-recognition-dataset/main/{category}/{subcategory}/{filename}",
                    cdn: "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/{category}/{subcategory}/{filename}",
                    thumbnail: "https://cdn.jsdelivr.net/gh/lsqkk/animal-recognition-dataset@main/{category}/{subcategory}/{filename}?width=300"
                }
            },
            endpoints: {
                categories: "GET /api/animal/categories - 获取分类详情",
                random: "GET /api/animal/random - 随机获取图片",
                by_id: "GET /api/animal/[subcategory_id]-[image_id] - 按ID获取图片",
                search: "GET /api/animal/search - 搜索图片",
                range: "GET /api/animal/range - 获取图片范围"
            },
            parameters: {
                use_cdn: "?use_cdn=true (默认) 使用CDN加速，false使用GitHub原图",
                category: "按大类筛选",
                subcategory: "按子类筛选",
                count: "返回数量 (1-20)",
                limit: "分页大小 (1-50)",
                page: "页码"
            },
            meta: {
                timestamp: new Date().toISOString(),
                cache_hint: "分类信息缓存10分钟，建议客户端适当缓存"
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error in animal index handler:', error);

        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to load animal dataset information"
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
};