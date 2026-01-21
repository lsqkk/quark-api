const quizManager = require('../../lib/quiz-manager');

module.exports = async (req, res) => {
    const { quiz: quizId, start = 0, end = 10 } = req.query;

    res.setHeader('Content-Type', 'application/json');

    try {
        const data = await quizManager.getQuestionsInRange(
            `${quizId}.json`,
            parseInt(start),
            parseInt(end)
        );

        res.status(200).json({
            success: true,
            data,
            meta: {
                version: '1.0',
                endpoint: '/api/quiz/range',
                parameters: { quizId, start, end }
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: error.message
        });
    }
};