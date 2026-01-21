const quizManager = require('../../lib/quiz-manager');

module.exports = async function handler(req, res) {
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'no-cache');

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
        const { source, count = 1, include_answers = 'false' } = req.query;
        const countNum = parseInt(count);
        const includeAnswers = include_answers === 'true';

        // 验证count参数
        if (countNum < 1 || countNum > 20) {
            return res.status(400).json({
                success: false,
                error: 'Invalid count parameter. Must be between 1 and 20'
            });
        }

        let questions;

        if (source) {
            // 从特定题库获取随机题目
            const quizData = await quizManager.getQuiz(`${source}.json`);

            if (!quizData || !quizData.questions || quizData.questions.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Quiz not found or has no questions'
                });
            }

            // 随机选择题目
            const shuffled = [...quizData.questions].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(countNum, quizData.questions.length));

            questions = selected.map(q => {
                const sanitized = quizManager.sanitizeQuestion(q, includeAnswers);
                return {
                    ...sanitized,
                    source: source,
                    quiz_title: quizData.quiz_title
                };
            });
        } else {
            // 从所有题库获取随机题目
            const allQuestions = await quizManager.getAllQuestionsIndex();

            if (!allQuestions || allQuestions.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No questions found in any quiz'
                });
            }

            // 随机选择题目
            const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(countNum, allQuestions.length));

            // 获取完整题目信息
            questions = await Promise.all(
                selected.map(async (item) => {
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
        }

        const response = {
            success: true,
            data: {
                questions: countNum === 1 ? questions[0] : questions,
                count: questions.length,
                source: source || 'all',
                include_answers: includeAnswers
            },
            meta: {
                timestamp: new Date().toISOString(),
                total_available: source ? (await quizManager.getQuiz(`${source}.json`)).questions.length : (await quizManager.getAllQuestionsIndex()).length
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error in random question handler:', error);

        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};