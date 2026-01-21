import quizManager from '../../lib/quiz-manager.js';

export default async function handler(req, res) {
    const { source, count = 1, seed } = req.query;

    res.setHeader('Content-Type', 'application/json');

    try {
        let questions;

        if (source) {
            // 从特定题库获取随机题目
            const quizData = await quizManager.getQuiz(`${source}.json`);
            const shuffled = [...quizData.questions].sort(() => Math.random() - 0.5);
            questions = shuffled.slice(0, Math.min(count, 10)).map(q =>
                quizManager.sanitizeQuestion(q)
            );
        } else {
            // 从所有题库获取随机题目
            const allQuestions = await quizManager.getAllQuestionsIndex();
            const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, Math.min(count, 10));

            questions = await Promise.all(
                selected.map(async (item) => {
                    const quizData = await quizManager.getQuiz(`${item.quizId}.json`);
                    const question = quizData.questions.find(q => q.id === item.questionId);
                    return {
                        ...quizManager.sanitizeQuestion(question),
                        source: item.quizId,
                        quiz_title: item.quizTitle
                    };
                })
            );
        }

        res.status(200).json({
            success: true,
            data: {
                questions: count === 1 ? questions[0] : questions,
                count: questions.length,
                source: source || 'all',
                seed: seed || null
            },
            meta: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
}