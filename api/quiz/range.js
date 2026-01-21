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
        const { quiz: quizId, start = 0, end = 10, include_answers = 'false' } = req.query;

        if (!quizId) {
            return res.status(400).json({
                success: false,
                error: 'Quiz parameter is required'
            });
        }

        const startNum = parseInt(start);
        const endNum = parseInt(end);
        const includeAnswers = include_answers === 'true';

        // 验证参数
        if (isNaN(startNum) || isNaN(endNum)) {
            return res.status(400).json({
                success: false,
                error: 'Start and end must be numbers'
            });
        }

        if (startNum < 0) {
            return res.status(400).json({
                success: false,
                error: 'Start must be greater than or equal to 0'
            });
        }

        if (endNum <= startNum) {
            return res.status(400).json({
                success: false,
                error: 'End must be greater than start'
            });
        }

        if (endNum - startNum > 50) {
            return res.status(400).json({
                success: false,
                error: 'Range too large. Maximum 50 questions per request'
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

        // 获取题目范围
        const questions = quizData.questions.slice(startNum, endNum);

        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No questions found in the specified range'
            });
        }

        // 处理题目数据
        const processedQuestions = questions.map(q => {
            const sanitized = quizManager.sanitizeQuestion(q, includeAnswers);
            return {
                ...sanitized,
                source: quizId,
                quiz_title: quizData.quiz_title
            };
        });

        const response = {
            success: true,
            data: {
                quiz: {
                    id: quizId,
                    title: quizData.quiz_title,
                    description: quizData.description,
                    total_questions: quizData.questions.length
                },
                questions: processedQuestions,
                range: {
                    start: startNum,
                    end: endNum,
                    count: processedQuestions.length,
                    has_more: endNum < quizData.questions.length
                }
            },
            meta: {
                timestamp: new Date().toISOString(),
                include_answers: includeAnswers
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error in range handler:', error);

        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};