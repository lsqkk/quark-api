const animalManager = require('../../lib/animal-manager');

module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    try {
        const {
            category,
            subcategory,
            count = 1,
            use_cdn = 'true',
            include_info = 'true'
        } = req.query;

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
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};