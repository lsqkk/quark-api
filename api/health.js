import quizManager from '../lib/quiz-manager.js';

export default async function handler(req, res) {
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
        console.error('Health check error:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}