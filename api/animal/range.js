const animalManager = require('../../lib/animal-manager');

module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=600');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    try {
        const {
            subcategory,
            start = 0,
            end = 10,
            use_cdn = 'true'
        } = req.query;

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
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};