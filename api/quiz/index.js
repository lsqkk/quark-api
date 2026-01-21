const quizManager = require('../../lib/quiz-manager');

export default async function handler(req, res) {
    // 设置响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    try {
        const index = await quizManager.getIndex();

        const response = {
            success: true,
            api: {
                name: "Quiz API",
                version: "1.0.0",
                base_path: "/api/quiz"
            },
            data: {
                meta: {
                    total_quizzes: index.index_info.total_quizzes,
                    created_at: index.index_info.created_at,
                    last_updated: index.index_info.last_updated
                },
                quizzes: index.quizzes.map(q => ({
                    id: q.source_file.replace('.json', ''),
                    title: q.quiz_title,
                    description: q.description,
                    stats: {
                        total_questions: q.total_questions,
                        questions_per_quiz: q.questions_per_quiz
                    },
                    file_info: {
                        name: q.source_file,
                        size: q.file_size,
                        last_modified: q.last_modified
                    },
                    endpoints: {
                        self: `/api/quiz/${q.source_file.replace('.json', '')}`,
                        random: `/api/quiz/random?source=${q.source_file.replace('.json', '')}`,
                        range: `/api/quiz/range?quiz=${q.source_file.replace('.json', '')}`
                    }
                }))
            },
            endpoints: {
                list: "GET /api/quiz",
                random: "GET /api/quiz/random",
                by_id: "GET /api/quiz/:id",
                range: "GET /api/quiz/range",
                search: "GET /api/quiz/search (coming soon)"
            }
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: error.message,
                timestamp: new Date().toISOString()
            }
        });
    }
}