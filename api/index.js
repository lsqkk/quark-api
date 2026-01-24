const path = require('path');

module.exports = async function handler(req, res) {
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // 处理OPTIONS预检请求
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

    const response = {
        service: "Quark API",
        version: "1.0.0",
        description: "一个包含多种服务的API集合",
        endpoints: {
            quiz: {
                base: "/api/quiz",
                description: "百科题库API",
                endpoints: {
                    list: "GET /api/quiz",
                    random: "GET /api/quiz/random",
                    by_id: "GET /api/quiz/[quizId]-[questionId]",
                    range: "GET /api/animal/range",
                    search: "GET /api/quiz/search"
                }
            },
            animal: {
                base: "/api/animal",
                description: "动物识别数据集API",
                endpoints: {
                    categories: "GET /api/animal/categories - 获取分类结构",
                    random: "GET /api/animal/random - 随机获取图片",
                    by_id: "GET /api/animal/[subcategory]-[id] - 按ID获取图片",
                    search: "GET /api/animal/search - 搜索图片",
                    range: "GET /api/animal/range - 获取图片范围"
                },
                dataset_info: {
                    source: "https://github.com/lsqkk/animal-recognition-dataset",
                    total_images: 9757,
                    total_categories: 5,
                    total_subcategories: 17
                }
            },
            health: {
                endpoint: "GET /api/health",
                description: "服务健康检查"
            },
            docs: {
                endpoint: "GET /docs",
                description: "API文档"
            }
        },
        links: {
            github: "https://github.com/lsqkk/quark-api",
            documentation: "https://quark-api.lsqkk.space/docs",
            status: "https://quark-api.lsqkk.space/api/health",
            animal_dataset: "https://github.com/lsqkk/animal-recognition-dataset"
        },
        meta: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }
    };

    res.status(200).json(response);
};