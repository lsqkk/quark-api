import quizManager from '../../lib/quiz-manager.js';

export default async function handler(req, res) {
    const { id } = req.query;
    const [quizId, questionId] = id ? id.split('-') : [null, null];

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!id || !quizId || !questionId) {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format. Expected: quizId-questionId',
            example: '/api/quiz/ibm-trivia-5'
        });
    }

    try {
        const { showAnswer } = req.query;

        const data = showAnswer === 'true'
            ? await quizManager.getQuizWithAnswers(quizId, questionId)
            : await quizManager.getQuestionById(quizId, questionId);

        res.status(200).json({
            success: true,
            data,
            meta: {
                version: '1.0',
                endpoint: `/api/quiz/${id}`,
                requested_with_answers: showAnswer === 'true'
            }
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            error: 'Not Found',
            message: error.message
        });
    }
}