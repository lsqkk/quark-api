// api/animal/index.js - 动物识别数据集API (聚合版)
const animalManager = require('../../lib/animal-manager');

module.exports = async function handler(req, res) {
    // 设置基础响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // 只允许GET请求
    if (req.method !== 'GET') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed',
            message: 'Only GET method is supported'
        });
    }

    // 解析请求路径
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathSegments = url.pathname.split('/').filter(segment => segment);

    // 确定请求的端点类型
    const endpointIndex = pathSegments.indexOf('animal') + 1;
    const endpoint = endpointIndex < pathSegments.length ? pathSegments[endpointIndex] : '';

    // 根据端点路由到相应的处理函数
    try {
        switch (endpoint) {
            case 'random':
                await handleRandom(req, res, url.searchParams);
                break;
            case 'search':
                await handleSearch(req, res, url.searchParams);
                break;
            case 'range':
                await handleRange(req, res, url.searchParams);
                break;
            case 'categories':
                await handleCategories(req, res, url.searchParams);
                break;
            default:
                // 检查是否是图片ID格式 (如: hashiqi-42)
                if (endpoint && /^[a-z]+-[\d]+$/.test(endpoint)) {
                    await handleImageById(req, res, endpoint, url.searchParams);
                } else {
                    // 默认为API主入口
                    await handleMain(req, res, url.searchParams);
                }
        }
    } catch (error) {
        console.error(`Error handling request to ${req.url}:`, error);
        res.setHeader('Content-Type', 'application/json');

        const statusCode = error.message.includes('not found') ? 404 :
            error.message.includes('Invalid') ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            error: error.message,
            meta: { timestamp: new Date().toISOString() }
        });
    }
};

// ========== 处理函数实现 ==========

/**
 * 主入口 - GET /api/animal
 */
async function handleMain(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');

    const structure = await animalManager.getDatasetStructure();

    const response = {
        success: true,
        api: {
            name: "Animal Recognition Dataset API",
            version: "1.0.0",
            base_url: "https://quark-api.lsqkk.space/api/animal",
            description: "提供动物识别数据集的图片访问服务 (聚合版)",
            source: "https://github.com/lsqkk/animal-recognition-dataset",
            note: "所有功能整合到单一端点以优化Vercel部署"
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
                        browse: `/api/animal/${sub.id}-1`
                    }
                })),
                total: cat.total,
                endpoints: {
                    random: `/api/animal/random?category=${cat.id}`,
                    browse: `/api/animal/categories?category=${cat.id}`
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
            category: "按大类筛选 (用于random和search)",
            subcategory: "按子类筛选 (用于random、search和range)",
            count: "返回数量 (1-20，用于random)",
            limit: "分页大小 (1-50，用于search)",
            page: "页码 (用于search)",
            redirect: "?redirect=true 直接重定向到图片URL (用于by_id)",
            info_only: "?info_only=true 仅返回元信息 (用于by_id)"
        },
        meta: {
            timestamp: new Date().toISOString(),
            cache_hint: "分类信息缓存10分钟，建议客户端适当缓存"
        }
    };

    res.status(200).json(response);
}

/**
 * 随机图片 - GET /api/animal/random
 */
async function handleRandom(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');

    const {
        category,
        subcategory,
        count = 1,
        use_cdn = 'true',
        include_info = 'true'
    } = Object.fromEntries(params);

    const countNum = parseInt(count);
    const useCdn = use_cdn.toLowerCase() === 'true';
    const includeInfo = include_info.toLowerCase() === 'true';

    // 参数验证
    if (countNum < 1 || countNum > 20) {
        return res.status(400).json({
            success: false,
            error: 'Invalid parameter',
            message: 'Count must be between 1 and 20'
        });
    }

    const images = await animalManager.getRandomImages(countNum, {
        category,
        subcategory,
        useCdn
    });

    const response = {
        success: true,
        data: {
            images: countNum === 1 ? images[0] : images,
            count: images.length,
            filters: {
                category: category || 'all',
                subcategory: subcategory || 'all'
            },
            url_type: useCdn ? 'cdn' : 'github_raw'
        }
    };

    // 如果不包含详细信息，只返回URL
    if (!includeInfo && countNum === 1) {
        response.data = {
            url: images[0].url,
            thumbnail: images[0].thumbnail,
            id: images[0].id
        };
    }

    res.status(200).json(response);
}

/**
 * 按ID获取图片 - GET /api/animal/[subcategory]-[id]
 */
async function handleImageById(req, res, imageId, params) {
    const {
        use_cdn = 'true',
        redirect = 'false',
        info_only = 'false'
    } = Object.fromEntries(params);

    const useCdn = use_cdn.toLowerCase() === 'true';
    const shouldRedirect = redirect.toLowerCase() === 'true';
    const infoOnly = info_only.toLowerCase() === 'true';

    // 如果只需要重定向到图片
    if (shouldRedirect && !infoOnly) {
        const image = await animalManager.getImageById(imageId, { useCdn });
        res.writeHead(302, { Location: image.url });
        return res.end();
    }

    const image = await animalManager.getImageById(imageId, { useCdn });

    // 如果只需要图片信息，不包含URL
    if (infoOnly) {
        const { url, thumbnail, ...imageInfo } = image;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=600');
        return res.status(200).json({
            success: true,
            data: imageInfo
        });
    }

    // 默认返回完整信息
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.status(200).json({
        success: true,
        data: image,
        meta: {
            timestamp: new Date().toISOString(),
            url_type: useCdn ? 'cdn' : 'github_raw'
        }
    });
}

/**
 * 搜索图片 - GET /api/animal/search
 */
async function handleSearch(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');

    const {
        q,
        category,
        subcategory,
        limit = 20,
        page = 1,
        use_cdn = 'true'
    } = Object.fromEntries(params);

    if (!q || q.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Missing parameter',
            message: 'Search query (q) is required'
        });
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const useCdn = use_cdn.toLowerCase() === 'true';

    if (limitNum < 1 || limitNum > 50) {
        return res.status(400).json({
            success: false,
            error: 'Invalid parameter',
            message: 'Limit must be between 1 and 50'
        });
    }

    if (pageNum < 1) {
        return res.status(400).json({
            success: false,
            error: 'Invalid parameter',
            message: 'Page must be greater than 0'
        });
    }

    const searchResult = await animalManager.searchImages(q, {
        category,
        subcategory,
        limit: limitNum,
        page: pageNum,
        useCdn
    });

    res.status(200).json({
        success: true,
        data: {
            query: q,
            ...searchResult,
            filters: {
                category: category || 'all',
                subcategory: subcategory || 'all'
            },
            url_type: useCdn ? 'cdn' : 'github_raw'
        },
        meta: {
            timestamp: new Date().toISOString(),
            search_executed: true
        }
    });
}

/**
 * 获取图片范围 - GET /api/animal/range
 */
async function handleRange(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=600');

    const {
        subcategory,
        start = 0,
        end = 10,
        use_cdn = 'true'
    } = Object.fromEntries(params);

    if (!subcategory) {
        return res.status(400).json({
            success: false,
            error: 'Missing parameter',
            message: 'Subcategory is required'
        });
    }

    const startNum = parseInt(start);
    const endNum = parseInt(end);
    const useCdn = use_cdn.toLowerCase() === 'true';

    if (startNum < 0 || endNum <= startNum || (endNum - startNum) > 50) {
        return res.status(400).json({
            success: false,
            error: 'Invalid parameter',
            message: 'Invalid range parameters. Ensure: start >= 0, end > start, range <= 50'
        });
    }

    const rangeResult = await animalManager.getImagesInRange(
        subcategory,
        startNum,
        endNum,
        { useCdn }
    );

    res.status(200).json({
        success: true,
        data: rangeResult,
        meta: {
            timestamp: new Date().toISOString(),
            url_type: useCdn ? 'cdn' : 'github_raw'
        }
    });
}

/**
 * 获取分类信息 - GET /api/animal/categories
 */
async function handleCategories(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');

    const { category: categoryId } = Object.fromEntries(params);
    const structure = await animalManager.getDatasetStructure();

    let responseData;

    if (categoryId) {
        // 获取特定分类详情
        const category = structure.categories.find(cat => cat.id === categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found',
                message: `Category '${categoryId}' does not exist`
            });
        }

        responseData = {
            category,
            related_endpoints: {
                random_in_category: `/api/animal/random?category=${categoryId}`,
                subcategories: category.subcategories.map(sub => ({
                    name: sub.name,
                    browse: `/api/animal/${sub.id}-1`,
                    random: `/api/animal/random?subcategory=${sub.id}`
                }))
            }
        };
    } else {
        // 获取所有分类
        responseData = {
            categories: structure.categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                subcategory_count: cat.subcategories.length,
                image_count: cat.total,
                top_subcategories: cat.subcategories
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3)
                    .map(sub => ({ id: sub.id, name: sub.name, count: sub.count }))
            })),
            stats: structure.stats
        };
    }

    res.status(200).json({
        success: true,
        data: responseData,
        meta: {
            timestamp: new Date().toISOString(),
            total_categories: structure.categories.length
        }
    });
}