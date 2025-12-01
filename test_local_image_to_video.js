import https from 'https';
import http from 'http';

// 设置环境变量
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('=== Starting local API image to video generation test ===');

// 通过本地API测试图生视频功能
async function testLocalImageToVideo() {
    try {
        // 构建请求参数
        const requestBody = {
            "model": "doubao-seedance-1-0-pro-fast-251015",
            "content": [
                {
                    "type": "text",
                    "text": "无人机以极快速度穿越复杂障碍或自然奇观，带来沉浸式飞行体验  --resolution 1080p  --duration 5 --camerafixed false --watermark true"
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://ark-project.tos-cn-beijing.volces.com/doc_image/seepro_i2v.png"
                    }
                }
            ]
        };

        console.log('Sending image to video generation request to local API...');
        console.log('Model:', requestBody.model);
        console.log('Content types:', requestBody.content.map(item => item.type));

        // 调用本地API服务器
        const data = await new Promise((resolve, reject) => {
            const postData = JSON.stringify(requestBody);
            const options = {
                hostname: 'localhost',
                port: 3001,
                // path: '/api/v3/contents/generations/tasks', // 尝试过不存在
                // path: '/api/v3/contents/generations/image-to-video', // 尝试过不存在
                path: '/api/doubao/videos/image-to-video', // 正确的专用端点路径
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = http.request(options, (res) => {
                let responseData = '';
                console.log('Local API Status Code:', res.statusCode);
                console.log('Local API Headers:', res.headers);

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        // 尝试解析JSON
                        const parsedData = JSON.parse(responseData);
                        resolve({ status: res.statusCode, data: parsedData });
                    } catch (e) {
                        // 如果不是JSON，则返回原始文本
                        resolve({ status: res.statusCode, data: responseData });
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Local API request error:', error);
                reject(error);
            });

            req.write(postData);
            req.end();
        });

        console.log('\n=== Local API Response ===');
        console.log('Status Code:', data.status);
        console.log('Response Data:', JSON.stringify(data.data, null, 2));

        // 检查是否成功创建任务
        if (data.status === 200) {
            if (data.data.id) {
                // 直接从API返回的格式
                console.log('\n✅ Image-to-video task created successfully!');
                console.log('Task ID:', data.data.id);
                console.log('\nTo check task status via local API:');
                console.log(`curl http://localhost:3001/api/doubao/videos/tasks/${data.data.id}`);
            } else if (data.data.ok && data.data.data && data.data.data.id) {
                // 本地API包装后的格式
                console.log('\n✅ Image-to-video task created successfully!');
                console.log('Task ID:', data.data.data.id);
                console.log('\nTo check task status via local API:');
                console.log(`curl http://localhost:3001/api/doubao/videos/tasks/${data.data.data.id}`);
            } else {
                console.log('\n⚠️  Response received but task ID not found in expected format');
            }
        } else {
            console.log('\n❌ Failed to create image-to-video task');
            if (data.data.error) {
                console.log('Error:', data.data.error.message || data.data.error);
            }
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error('Error details:', error);
    }
}

// 运行测试
testLocalImageToVideo();
