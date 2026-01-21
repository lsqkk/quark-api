import quizManager from '../../lib/quiz-manager.js';

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
                    total_questions: quizzes.reduce((sum, quiz) => sum + quiz.stats.actual, 0)
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                request_id: req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9)
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
}