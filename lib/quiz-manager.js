import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录名（ES模块中没有__dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class QuizManager {
    constructor() {
        // 根据运行环境确定数据路径
        this.basePath = this.getDataPath();
        this.quizzesPath = path.join(this.basePath, 'quizzes');
        this.indexPath = path.join(this.basePath, 'index', 'ti_index.json');
        this.memoryCache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5分钟缓存
    }

    // 获取数据目录路径
    getDataPath() {
        // 如果指定了环境变量，使用环境变量
        if (process.env.DATA_PATH) {
            return path.resolve(process.env.DATA_PATH);
        }

        // Vercel部署环境
        if (process.env.VERCEL) {
            // Vercel环境下，数据文件在项目根目录的data文件夹中
            return path.join(process.cwd(), 'data');
        }

        // 本地开发环境
        if (process.env.NODE_ENV === 'development') {
            // 开发环境：从项目根目录开始
            return path.join(process.cwd(), 'data');
        }

        // 默认情况：从lib目录向上找data
        return path.join(__dirname, '..', 'data');
    }

    // 确保目录存在
    async ensureDir(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    // 获取索引文件
    async getIndex() {
        const cacheKey = 'index_data';
        const now = Date.now();

        // 检查内存缓存
        if (this.memoryCache.has(cacheKey)) {
            const cached = this.memoryCache.get(cacheKey);
            if (now - cached.timestamp < this.cacheTTL) {
                return cached.data;
            }
        }

        try {
            const data = await fs.readFile(this.indexPath, 'utf8');
            const index = JSON.parse(data);

            // 更新内存缓存
            this.memoryCache.set(cacheKey, {
                data: index,
                timestamp: now
            });

            return index;
        } catch (error) {
            console.error('Error reading index file:', error);

            // 如果索引文件不存在，尝试动态生成
            if (error.code === 'ENOENT') {
                return await this.generateIndex();
            }

            throw new Error(`Failed to load index: ${error.message}`);
        }
    }

    // 动态生成索引（如果索引文件不存在）
    async generateIndex() {
        console.log('Generating index dynamically...');

        try {
            await this.ensureDir(this.quizzesPath);

            // 读取quizzes目录下的所有json文件
            const files = await fs.readdir(this.quizzesPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            const quizzes = [];

            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(this.quizzesPath, file);
                    const stats = await fs.stat(filePath);
                    const content = await fs.readFile(filePath, 'utf8');
                    const quizData = JSON.parse(content);

                    quizzes.push({
                        source_file: file,
                        last_modified: stats.mtime.toISOString(),
                        file_size: stats.size,
                        quiz_title: quizData.quiz_title || 'Untitled Quiz',
                        description: quizData.description || '',
                        total_questions: quizData.total_questions || 0,
                        questions_per_quiz: quizData.questions_per_quiz || 10,
                        actual_questions: quizData.questions?.length || 0,
                        added_at: new Date().toISOString()
                    });
                } catch (error) {
                    console.warn(`Skipping invalid quiz file: ${file}`, error.message);
                }
            }

            const index = {
                index_info: {
                    created_at: new Date().toISOString(),
                    last_updated: new Date().toISOString(),
                    total_quizzes: quizzes.length,
                    auto_generated: true
                },
                quizzes: quizzes
            };

            // 保存生成的索引文件
            await this.ensureDir(path.dirname(this.indexPath));
            await fs.writeFile(
                this.indexPath,
                JSON.stringify(index, null, 2)
            );

            return index;
        } catch (error) {
            console.error('Failed to generate index:', error);
            throw error;
        }
    }

    // 获取题库内容
    async getQuiz(filename) {
        // 检查内存缓存
        const cacheKey = `quiz_${filename}`;
        const now = Date.now();

        if (this.memoryCache.has(cacheKey)) {
            const cached = this.memoryCache.get(cacheKey);
            if (now - cached.timestamp < this.cacheTTL) {
                return cached.data;
            }
        }

        try {
            // 确保有.json后缀
            const actualFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
            const filePath = path.join(this.quizzesPath, actualFilename);

            const data = await fs.readFile(filePath, 'utf8');
            const quiz = JSON.parse(data);

            // 验证数据格式
            if (!quiz.questions || !Array.isArray(quiz.questions)) {
                throw new Error(`Invalid quiz format in ${filename}: missing questions array`);
            }

            // 缓存数据
            this.memoryCache.set(cacheKey, {
                data: quiz,
                timestamp: now
            });

            return quiz;
        } catch (error) {
            console.error(`Error loading quiz ${filename}:`, error);

            if (error.code === 'ENOENT') {
                throw new Error(`Quiz file not found: ${filename}`);
            }

            throw new Error(`Failed to load quiz: ${error.message}`);
        }
    }

    // 清理题目（移除答案信息）
    sanitizeQuestion(question, includeAnswers = false) {
        if (!question) return null;

        const sanitized = { ...question };

        if (!includeAnswers) {
            // 移除答案信息
            delete sanitized.correct_answer;

            // 清理选项中的答案标识
            if (sanitized.options && Array.isArray(sanitized.options)) {
                sanitized.options = sanitized.options.map(opt => ({
                    letter: opt.letter,
                    text: opt.text
                    // 不包含 is_correct
                }));
            }
        }

        return sanitized;
    }

    // 获取题库列表（简化版）
    async getQuizList() {
        const index = await this.getIndex();
        return index.quizzes.map(quiz => ({
            id: quiz.source_file.replace('.json', ''),
            title: quiz.quiz_title,
            description: quiz.description,
            stats: {
                total: quiz.total_questions,
                per_quiz: quiz.questions_per_quiz,
                actual: quiz.actual_questions
            },
            file_info: {
                name: quiz.source_file,
                size: quiz.file_size,
                updated: quiz.last_modified
            }
        }));
    }

    // ========== 添加缺失的方法 ==========

    // 获取所有问题的索引
    async getAllQuestionsIndex() {
        const cacheKey = 'all_questions_index';
        const now = Date.now();

        if (this.memoryCache.has(cacheKey)) {
            const cached = this.memoryCache.get(cacheKey);
            if (now - cached.timestamp < this.cacheTTL) {
                return cached.data;
            }
        }

        const index = await this.getIndex();
        const allQuestions = [];

        for (const quiz of index.quizzes) {
            const quizData = await this.getQuiz(quiz.source_file);
            if (quizData.questions && Array.isArray(quizData.questions)) {
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
        }

        this.memoryCache.set(cacheKey, {
            data: allQuestions,
            timestamp: now
        });

        return allQuestions;
    }

    // 根据ID获取题目
    async getQuestionById(quizId, questionId) {
        const quiz = await this.getQuiz(`${quizId}.json`);
        const question = quiz.questions.find(q => q.id === parseInt(questionId));

        if (!question) {
            throw new Error(`Question not found: ${quizId}-${questionId}`);
        }

        return {
            quiz: {
                title: quiz.quiz_title,
                source: quizId
            },
            question: this.sanitizeQuestion(question)
        };
    }

    // 获取题目范围
    async getQuestionsInRange(filename, start, end) {
        const quiz = await this.getQuiz(filename);
        const questions = quiz.questions.slice(start, end);

        return {
            quiz: {
                title: quiz.quiz_title,
                total_questions: quiz.total_questions
            },
            questions: questions.map(q => this.sanitizeQuestion(q)),
            range: { start, end, count: questions.length }
        };
    }

    // 获取题目（包含答案）
    async getQuizWithAnswers(quizId, questionId) {
        const quiz = await this.getQuiz(`${quizId}.json`);
        const question = quiz.questions.find(q => q.id === parseInt(questionId));

        if (!question) {
            throw new Error(`Question not found: ${quizId}-${questionId}`);
        }

        return {
            quiz: {
                title: quiz.quiz_title,
                source: quizId
            },
            question: question  // 包含答案
        };
    }

    // 获取随机题目
    async getRandomQuestion() {
        const allQuestions = await this.getAllQuestionsIndex();
        if (allQuestions.length === 0) {
            throw new Error('No questions available');
        }

        const randomIndex = Math.floor(Math.random() * allQuestions.length);
        const randomItem = allQuestions[randomIndex];

        const quizData = await this.getQuiz(`${randomItem.quizId}.json`);
        const question = quizData.questions.find(q => q.id === randomItem.questionId);

        return {
            quiz: {
                title: randomItem.quizTitle,
                source: randomItem.quizId
            },
            question: this.sanitizeQuestion(question)
        };
    }

    // 清理过期的缓存
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.memoryCache.entries()) {
            if (now - value.timestamp > this.cacheTTL) {
                this.memoryCache.delete(key);
            }
        }
    }
}

// 创建单例实例
const quizManager = new QuizManager();

// 定期清理缓存（每小时一次）
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        quizManager.cleanupCache();
    }, 60 * 60 * 1000); // 每小时
}

export default quizManager;