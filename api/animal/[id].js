const animalManager = require('../../lib/animal-manager');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Missing parameter',
                message: 'Image ID is required'
            });
        }

        const {
            use_cdn = 'true',
            redirect = 'false',
            info_only = 'false'
        } = req.query;

        const useCdn = use_cdn.toLowerCase() === 'true';
        const shouldRedirect = redirect.toLowerCase() === 'true';
        const infoOnly = info_only.toLowerCase() === 'true';

        // 如果只需要重定向到图片
        if (shouldRedirect && !infoOnly) {
            const image = await animalManager.getImageById(id, { useCdn });
            res.writeHead(302, { Location: image.url });
            return res.end();
        }

        const image = await animalManager.getImageById(id, { useCdn });

        // 如果只需要图片信息，不包含URL
        if (infoOnly) {
            const { url, thumbnail, ...imageInfo } = image;
            return res.status(200).json({
                success: true,
                data: imageInfo
            });
        }

        // 默认返回完整信息
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
            success: true,
            data: image,
            meta: {
                timestamp: new Date().toISOString(),
                url_type: useCdn ? 'cdn' : 'github_raw'
            }
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Image not found',
            message: error.message
        });
    }
};