// api/quiz/index.js - 百科题库API (聚合版)
const quizManager = require('../../lib/quiz-manager');

module.exports = async function handler(req, res) {
    // 设置基础响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // 只允许GET请求
    if (req.method !== 'GET') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed',
            message: 'Only GET method is supported'
        });
    }

    // 解析请求路径
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathSegments = url.pathname.split('/').filter(segment => segment);

    // 确定请求的端点类型
    const endpointIndex = pathSegments.indexOf('quiz') + 1;
    const endpoint = endpointIndex < pathSegments.length ? pathSegments[endpointIndex] : '';

    try {
        switch (endpoint) {
            case 'random':
                await handleRandom(req, res, url.searchParams);
                break;
            case 'search':
                await handleSearch(req, res, url.searchParams);
                break;
            case 'range':
                await handleRange(req, res, url.searchParams);
                break;
            default:
                // 检查是否是题目ID格式 (如: ibm-trivia-15)
                if (endpoint && /^[a-zA-Z]+-[a-zA-Z]+-[\d]+$/.test(endpoint)) {
                    await handleQuestionById(req, res, endpoint, url.searchParams);
                } else {
                    // 默认为API主入口
                    await handleMain(req, res, url.searchParams);
                }
        }
    } catch (error) {
        console.error(`Error handling request to ${req.url}:`, error);
        res.setHeader('Content-Type', 'application/json');

        const statusCode = error.message.includes('not found') ? 404 :
            error.message.includes('Invalid') ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            error: error.message,
            meta: { timestamp: new Date().toISOString() }
        });
    }
};

// ========== 处理函数实现 ==========

/**
 * 主入口 - GET /api/quiz
 */
async function handleMain(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200');

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
                documentation: "https://quark-api.lsqkk.space/docs",
                note: "所有功能整合到单一端点以优化Vercel部署"
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
            parameters: {
                source: "题库ID，如: ibm-trivia (用于random和search)",
                count: "返回数量 (1-20，用于random)",
                include_answers: "是否包含答案 (用于random, by_id, range)",
                showAnswer: "是否显示答案 (用于by_id)",
                include_options: "是否包含选项 (用于by_id)",
                start: "起始索引 (用于range)",
                end: "结束索引 (用于range)",
                q: "搜索关键词 (用于search)",
                limit: "分页大小 (1-50，用于search)",
                page: "页码 (用于search)"
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
}

/**
 * 随机题目 - GET /api/quiz/random
 */
async function handleRandom(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');

    const { source, count = 1, include_answers = 'false' } = Object.fromEntries(params);
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
}

/**
 * 按ID获取题目 - GET /api/quiz/[quizId]-[questionId]
 */
async function handleQuestionById(req, res, questionId, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const { showAnswer = 'false', include_options = 'true' } = Object.fromEntries(params);
    const includeAnswers = showAnswer === 'true';
    const includeOptions = include_options === 'true';

    // 解析ID格式：quizId-questionId
    const idParts = questionId.split('-');
    if (idParts.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format. Expected: quizId-questionId'
        });
    }

    // 获取questionId（最后一个部分）
    const questionIdStr = idParts.pop();
    const quizId = idParts.join('-'); // 处理可能包含连字符的quizId

    const questionIdNum = parseInt(questionIdStr);

    if (isNaN(questionIdNum)) {
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
    const question = quizData.questions.find(q => q.id === questionIdNum);

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
                previous: questionIdNum > 1 ? `${quizId}-${questionIdNum - 1}` : null,
                next: questionIdNum < quizData.questions.length ? `${quizId}-${questionIdNum + 1}` : null,
                total_in_quiz: quizData.questions.length,
                current_position: questionIdNum
            }
        },
        meta: {
            timestamp: new Date().toISOString(),
            requested_with_answers: includeAnswers,
            include_options: includeOptions
        }
    };

    res.status(200).json(response);
}

/**
 * 获取题目范围 - GET /api/quiz/range
 */
async function handleRange(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { quiz: quizId, start = 0, end = 10, include_answers = 'false' } = Object.fromEntries(params);

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
}

/**
 * 搜索题目 - GET /api/quiz/search
 */
async function handleSearch(req, res, params) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');

    const {
        q,
        source,
        limit = 10,
        page = 1,
        include_answers = 'false'
    } = Object.fromEntries(params);

    if (!q || q.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'Search query (q) is required'
        });
    }

    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const includeAnswers = include_answers === 'true';

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

    try {
        const allQuestions = await quizManager.getAllQuestionsIndex();

        // 搜索逻辑
        const searchTerm = q.toLowerCase().trim();
        let results = allQuestions.filter(item =>
            item.question.toLowerCase().includes(searchTerm) ||
            item.quizTitle.toLowerCase().includes(searchTerm)
        );

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
}