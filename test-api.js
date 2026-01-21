import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testEndpoint(endpoint, description) {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`URL: ${BASE_URL}${endpoint}`);

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const data = await response.json();

        console.log(`Status: ${response.status}`);
        console.log(`Success: ${data.success || (data.status === 'healthy')}`);

        if (data.error) {
            console.error(`Error: ${data.error}`);
        }

        return { success: response.status === 200, data };
    } catch (error) {
        console.error(`Request failed: ${error.message}`);
        return { success: false, error };
    }
}

async function runAllTests() {
    console.log('🚀 Starting API Tests...');

    // 1. 测试根路径
    await testEndpoint('/', 'API Root');

    // 2. 测试健康检查
    await testEndpoint('/api/health', 'Health Check');

    // 3. 测试题库列表
    await testEndpoint('/api/quiz', 'Quiz List');

    // 4. 测试随机题目
    await testEndpoint('/api/quiz/random', 'Random Question');

    console.log('\n✅ Tests completed!');
}

runAllTests().catch(console.error);