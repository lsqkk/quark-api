const animalManager = require('../../lib/animal-manager');

module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    try {
        const {
            q,
            category,
            subcategory,
            limit = 20,
            page = 1,
            use_cdn = 'true'
        } = req.query;

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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};