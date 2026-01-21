const quizManager = require('../lib/quiz-manager');

module.exports = async function handler(req, res) {
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({
            status: 'error',
            error: 'Method Not Allowed'
        });
    }

    try {
        const index = await quizManager.getIndex();
        const quizzes = await quizManager.getQuizList();

        // 计算总题目数
        const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.stats.actual, 0);

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            data: {
                quizzes_count: index.index_info.total_quizzes,
                total_questions: totalQuestions,
                last_updated: index.index_info.last_updated
            },
            services: {
                database: 'operational',
                cache: 'operational',
                api: 'operational'
            },
            performance: {
                uptime: process.uptime(),
                memory_usage: process.memoryUsage()
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
};