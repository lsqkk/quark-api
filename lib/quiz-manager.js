const fs = require('fs').promises;
const path = require('path');

class QuizManager {
    constructor() {
        this.basePath = process.env.NODE_ENV === 'development'
            ? path.join(process.cwd(), 'data')
            : path.join(process.cwd(), '..', 'data'); // Vercel部署时的路径

        this.quizzesPath = path.join(this.basePath, 'quizzes');
        this.indexPath = path.join(this.basePath, 'index', 'ti_index.json');
        this.cache = new Map();
    }

    // 解析ID参数：quiz-question 格式
    parseId(id) {
        const parts = id.split('-');
        if (parts.length === 2) {
            return {
                quizFile: `${parts[0]}.json`,
                questionId: parseInt(parts[1])
            };
        }
        throw new Error('Invalid ID format. Expected: quizId-questionId');
    }

    // 获取所有题库的合并索引
    async getAllQuestionsIndex() {
        const cacheKey = 'all_questions_index';
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const index = await this.getIndex();
        const allQuestions = [];

        for (const quiz of index.quizzes) {
            const quizData = await this.getQuiz(quiz.source_file);
            quizData.questions.forEach(q => {
                allQuestions.push({
                    globalId: `${quiz.source_file.replace('.json', '')}-${q.id}`,
                    quizId: quiz.source_file.replace('.json', ''),
                    questionId: q.id,
                    question: q.question,
                    quizTitle: quizData.quiz_title
                });
            });
        }

        this.cache.set(cacheKey, allQuestions);
        return allQuestions;
    }

    // 从全局获取随机题目
    async getGlobalRandomQuestion() {
        const allQuestions = await this.getAllQuestionsIndex();
        const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];

        const quizData = await this.getQuiz(`${randomQuestion.quizId}.json`);
        const question = quizData.questions.find(q => q.id === randomQuestion.questionId);

        return {
            source: randomQuestion.quizId,
            question: this.sanitizeQuestion(question),
            meta: {
                total_questions: allQuestions.length,
                quiz_title: randomQuestion.quizTitle
            }
        };
    }
}

module.exports = new QuizManager();