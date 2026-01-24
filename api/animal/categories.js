const animalManager = require('../../lib/animal-manager');

module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method Not Allowed' });

    try {
        const structure = await animalManager.getDatasetStructure();
        const { category: categoryId } = req.query;

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
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};