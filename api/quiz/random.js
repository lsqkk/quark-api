import quizManager from '../../lib/quiz-manager.js';

export default async function handler(req, res) {
    const { source, count = 1, seed } = req.query;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        let questions = [];
        const numCount = Math.min(parseInt(count), 10); // 最多10个

        if (source) {
            // 从特定题库获取随机题目
            const quizData = await quizManager.getQuiz(`${source}.json`);
            const shuffled = [...quizData.questions].sort(() => Math.random() - 0.5);
            questions = shuffled.slice(0, numCount).map(q =>
                quizManager.sanitizeQuestion(q)
            );
        } else {
            // 从所有题库获取随机题目
            for (let i = 0; i < numCount; i++) {
                const randomQuestion = await quizManager.getRandomQuestion();
                questions.push({
                    ...randomQuestion.question,
                    source: randomQuestion.quiz.source,
                    quiz_title: randomQuestion.quiz.title
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                questions: numCount === 1 ? questions[0] : questions,
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