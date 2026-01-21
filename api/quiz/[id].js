const quizManager = require('../../lib/quiz-manager');

module.exports = async (req, res) => {
    const { id } = req.query;
    const [quizId, questionId] = id.split('-');

    res.setHeader('Content-Type', 'application/json');

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
};