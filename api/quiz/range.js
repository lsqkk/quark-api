import quizManager from '../../lib/quiz-manager.js';

export default async function handler(req, res) {
    const { quiz: quizId, start = 0, end = 10 } = req.query;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!quizId) {
        return res.status(400).json({
            success: false,
            error: 'Missing quiz parameter',
            example: '/api/quiz/range?quiz=ibm-trivia&start=0&end=5'
        });
    }

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
}