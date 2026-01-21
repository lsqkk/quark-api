import quizManager from '../../lib/quiz-manager.js';

export default async function handler(req, res) {
    // 记录请求开始时间
    const startTime = Date.now();

    const { q, source, limit = 10, page = 1 } = req.query;

    if (!q) {
        return res.status(400).json({
            success: false,
            error: 'Search query (q) is required'
        });
    }

    res.setHeader('Content-Type', 'application/json');

    try {
        const allQuestions = await quizManager.getAllQuestionsIndex();

        // 简单搜索逻辑（可扩展为更复杂的搜索）
        const results = allQuestions.filter(item =>
            item.question.toLowerCase().includes(q.toLowerCase()) ||
            item.quizTitle.toLowerCase().includes(q.toLowerCase())
        );

        // 按来源筛选
        const filteredResults = source
            ? results.filter(item => item.quizId === source)
            : results;

        // 分页
        const startIndex = (page - 1) * limit;
        const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);

        // 获取完整题目信息
        const questionsWithDetails = await Promise.all(
            paginatedResults.map(async (item) => {
                const quizData = await quizManager.getQuiz(`${item.quizId}.json`);
                const question = quizData.questions.find(q => q.id === item.questionId);
                return {
                    ...quizManager.sanitizeQuestion(question),
                    source: item.quizId,
                    quiz_title: item.quizTitle,
                    global_id: item.globalId
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                query: q,
                results: questionsWithDetails,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total_results: filteredResults.length,
                    total_pages: Math.ceil(filteredResults.length / limit)
                },
                filters: {
                    source: source || 'all'
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                search_time: Date.now() - startTime
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}