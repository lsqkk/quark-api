const quizManager = require('../../lib/quiz-manager');

module.exports = async function handler(req, res) {
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许GET请求
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed'
        });
    }

    try {
        const { q, source, limit = 10, page = 1, include_answers = 'false' } = req.query;
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const includeAnswers = include_answers === 'true';

        // 验证参数
        if (!q || q.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Search query (q) is required'
            });
        }

        if (limitNum < 1 || limitNum > 50) {
            return res.status(400).json({
                success: false,
                error: 'Limit must be between 1 and 50'
            });
        }

        if (pageNum < 1) {
            return res.status(400).json({
                success: false,
                error: 'Page must be greater than 0'
            });
        }

        const allQuestions = await quizManager.getAllQuestionsIndex();

        // 搜索逻辑
        const searchTerm = q.toLowerCase().trim();
        const results = allQuestions.filter(item => {
            return item.question.toLowerCase().includes(searchTerm) ||
                item.quizTitle.toLowerCase().includes(searchTerm);
        });

        // 按来源筛选
        const filteredResults = source
            ? results.filter(item => item.quizId === source)
            : results;

        // 分页
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedResults = filteredResults.slice(startIndex, startIndex + limitNum);

        // 获取完整题目信息
        const questionsWithDetails = await Promise.all(
            paginatedResults.map(async (item) => {
                const quizData = await quizManager.getQuiz(`${item.quizId}.json`);
                const question = quizData.questions.find(q => q.id === item.questionId);
                const sanitized = quizManager.sanitizeQuestion(question, includeAnswers);

                return {
                    ...sanitized,
                    source: item.quizId,
                    quiz_title: item.quizTitle,
                    global_id: item.globalId
                };
            })
        );

        const response = {
            success: true,
            data: {
                query: q,
                results: questionsWithDetails,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total_results: filteredResults.length,
                    total_pages: Math.ceil(filteredResults.length / limitNum),
                    has_next: startIndex + limitNum < filteredResults.length,
                    has_prev: pageNum > 1
                },
                filters: {
                    source: source || 'all',
                    include_answers: includeAnswers
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                search_time_ms: Date.now() - (req._startTime || Date.now())
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error in search handler:', error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};