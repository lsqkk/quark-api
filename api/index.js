export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const response = {
        service: "Quark API",
        version: "1.0.0",
        description: "一个包含多种服务的API集合",
        endpoints: {
            quiz: {
                base: "/api/quiz",
                description: "百科题库API",
                endpoints: {
                    list: "GET /api/quiz",
                    random: "GET /api/quiz/random",
                    by_id: "GET /api/quiz/[quizId]-[questionId]",
                    range: "GET /api/quiz/range"
                }
            },
            health: {
                endpoint: "GET /api/health",
                description: "服务健康检查"
            },
            docs: {
                endpoint: "GET /docs",
                description: "API文档"
            }
        },
        links: {
            github: "https://github.com/lsqkk/quark-api",
            documentation: "https://quark-api.lsqkk.space/docs",
            status: "https://quark-api.lsqkk.space/api/health"
        },
        meta: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }
    };

    res.status(200).json(response);
}