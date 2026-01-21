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
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID parameter is required'
            });
        }

        const { showAnswer = 'false', include_options = 'true' } = req.query;
        const includeAnswers = showAnswer === 'true';
        const includeOptions = include_options === 'true';

        // 解析ID格式：quizId-questionId
        const idParts = id.split('-');
        if (idParts.length !== 2) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID format. Expected: quizId-questionId'
            });
        }

        const [quizId, questionIdStr] = idParts;
        const questionId = parseInt(questionIdStr);

        if (isNaN(questionId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid question ID. Must be a number'
            });
        }

        // 获取题库
        const quizData = await quizManager.getQuiz(`${quizId}.json`);

        if (!quizData) {
            return res.status(404).json({
                success: false,
                error: 'Quiz not found'
            });
        }

        // 查找题目
        const question = quizData.questions.find(q => q.id === questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        // 处理题目数据
        let processedQuestion;
        if (includeAnswers) {
            // 包含答案
            processedQuestion = {
                ...question,
                source: quizId,
                quiz_title: quizData.quiz_title,
                quiz_description: quizData.description
            };
        } else {
            // 不包含答案
            processedQuestion = quizManager.sanitizeQuestion(question, false);
            processedQuestion.source = quizId;
            processedQuestion.quiz_title = quizData.quiz_title;
            processedQuestion.quiz_description = quizData.description;
        }

        // 如果不包含选项，移除options字段
        if (!includeOptions && processedQuestion.options) {
            delete processedQuestion.options;
        }

        const response = {
            success: true,
            data: {
                question: processedQuestion,
                navigation: {
                    previous: questionId > 1 ? `${quizId}-${questionId - 1}` : null,
                    next: questionId < quizData.questions.length ? `${quizId}-${questionId + 1}` : null,
                    total_in_quiz: quizData.questions.length,
                    current_position: questionId
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                requested_with_answers: includeAnswers,
                include_options: includeOptions
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error in question by ID handler:', error);

        if (error.message.includes('not found') || error.message.includes('ENOENT')) {
            return res.status(404).json({
                success: false,
                error: 'Resource not found',
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
};