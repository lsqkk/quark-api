const quizManager = require('../../lib/quiz-manager');

module.exports = async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许GET方法
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed',
            message: 'Only GET method is supported'
        });
    }

    try {
        const quizzes = await quizManager.getQuizList();

        // 计算统计信息
        const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.stats.actual, 0);
        const totalQuestionsPerQuiz = quizzes.reduce((sum, quiz) => sum + quiz.stats.per_quiz, 0);

        const response = {
            success: true,
            api: {
                name: "Quiz API",
                version: "1.0.0",
                base_url: "https://quark-api.lsqkk.space/api/quiz",
                documentation: "https://quark-api.lsqkk.space/docs"
            },
            data: {
                quizzes: quizzes,
                stats: {
                    total_quizzes: quizzes.length,
                    total_questions: totalQuestions,
                    avg_questions_per_quiz: Math.round(totalQuestionsPerQuiz / quizzes.length) || 0
                }
            },
            endpoints: {
                list: "GET /api/quiz",
                random: "GET /api/quiz/random",
                by_id: "GET /api/quiz/[quizId]-[questionId]",
                range: "GET /api/quiz/range",
                search: "GET /api/quiz/search"
            },
            meta: {
                timestamp: new Date().toISOString(),
                request_id: req.headers['x-request-id'] || Math.random().toString(36).substring(2, 11)
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error in quiz index handler:', error);

        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to load quiz list",
                detail: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    }
};