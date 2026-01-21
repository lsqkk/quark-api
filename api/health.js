const quizManager = require('../lib/quiz-manager');

module.exports = async (req, res) => {
    try {
        const index = await quizManager.getIndex();

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            data: {
                quizzes_count: index.index_info.total_quizzes,
                last_updated: index.index_info.last_updated
            },
            services: {
                database: 'operational',
                cache: 'operational',
                api: 'operational'
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
};