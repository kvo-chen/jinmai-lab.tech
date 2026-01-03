const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// 图片检查结果类型
class ImageCheckResult {
  constructor(url, page, error = null, errorType = null, reason = null) {
    this.url = url;
    this.page = page;
    this.error = error;
    this.errorType = errorType;
    this.reason = reason;
    this.timestamp = new Date();
  }
}

// 图片检查器
class ImageChecker {
  constructor() {
    this.results = [];
    this.imageUrls = new Set();
    this.filesToCheck = [];
    this.supportedExtensions = ['.tsx', '.ts', '.jsx', '.js', '.html', '.md'];
  }

  // 扫描项目文件，提取图片URL
  scanProject(directory) {
    console.log('开始扫描项目文件...');
    this._scanDirectory(directory);
    console.log(`发现 ${this.filesToCheck.length} 个文件需要检查`);
    
    this._extractImageUrls();
    console.log(`提取到 ${this.imageUrls.size} 个图片URL`);
  }

  // 递归扫描目录
  _scanDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        // 跳过某些目录
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
          continue;
        }
        this._scanDirectory(filePath);
      } else if (stats.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (this.supportedExtensions.includes(ext)) {
          this.filesToCheck.push(filePath);
        }
      }
    }
  }

  // 从文件中提取图片URL
  _extractImageUrls() {
    const imageUrlRegex = /src=["']([^"']+)["']|url\(["']?([^"')]+)["']?\)|background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
    
    for (const file of this.filesToCheck) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        
        while ((match = imageUrlRegex.exec(content)) !== null) {
          const url = match[1] || match[2] || match[3];
          if (url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:'))) {
            this.imageUrls.add(url);
          }
        }
      } catch (error) {
        console.error(`读取文件失败: ${file}`, error);
      }
    }
  }

  // 检查单个图片URL
  async checkImageUrl(url) {
    return new Promise((resolve) => {
      // 跳过data URL
      if (url.startsWith('data:')) {
        resolve(new ImageCheckResult(url, 'inline', null, null, 'data URL，无需网络请求'));
        return;
      }

      // 处理相对路径
      const isAbsolute = url.startsWith('http');
      const finalUrl = isAbsolute ? url : `http://localhost:5173${url}`;

      // 选择HTTP客户端
      const client = finalUrl.startsWith('https') ? https : http;

      // 设置超时
      const timeout = 5000;

      const req = client.get(finalUrl, {
        timeout: timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }, (res) => {
        let error = null;
        let errorType = null;
        let reason = null;

        // 检查状态码
        if (res.statusCode >= 400) {
          error = `HTTP ${res.statusCode}`;
          errorType = 'status_error';
          reason = `服务器返回错误状态码: ${res.statusCode}`;
        }

        // 检查Content-Type
        const contentType = res.headers['content-type'];
        if (contentType && !contentType.startsWith('image/')) {
          error = 'Invalid Content-Type';
          errorType = 'format_error';
          reason = `返回的内容不是图片，Content-Type: ${contentType}`;
        }

        resolve(new ImageCheckResult(url, 'unknown', error, errorType, reason));
      });

      // 处理超时
      req.on('timeout', () => {
        req.destroy();
        resolve(new ImageCheckResult(url, 'unknown', 'Timeout', 'timeout', '图片加载超时'));
      });

      // 处理错误
      req.on('error', (err) => {
        let errorType = 'network_error';
        let reason = err.message;

        if (err.code === 'ENOTFOUND') {
          errorType = 'dns_error';
          reason = '域名解析失败';
        } else if (err.code === 'ECONNREFUSED') {
          errorType = 'connection_refused';
          reason = '连接被拒绝';
        }

        resolve(new ImageCheckResult(url, 'unknown', err.message, errorType, reason));
      });
    });
  }

  // 检查所有图片URL
  async checkAllImages() {
    console.log('开始检查图片URL...');
    let index = 0;
    const total = this.imageUrls.size;

    for (const url of this.imageUrls) {
      index++;
      console.log(`检查 ${index}/${total}: ${url}`);
      
      try {
        const result = await this.checkImageUrl(url);
        this.results.push(result);
      } catch (error) {
        console.error(`检查图片失败: ${url}`, error);
        this.results.push(new ImageCheckResult(url, 'unknown', error.message, 'unknown_error', '检查过程中发生异常'));
      }
    }
  }

  // 生成检查报告
  generateReport() {
    const report = {
      timestamp: new Date(),
      totalImages: this.imageUrls.size,
      successfulImages: this.results.filter(r => !r.error).length,
      failedImages: this.results.filter(r => r.error).length,
      results: this.results
    };

    // 保存为JSON文件
    const reportPath = path.join(process.cwd(), 'image-check-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`检查报告已保存到: ${reportPath}`);

    // 生成人类可读的报告
    this._generateHumanReadableReport(report);
  }

  // 生成人类可读的报告
  _generateHumanReadableReport(report) {
    const reportPath = path.join(process.cwd(), 'IMAGE_CHECK_REPORT.md');
    
    let markdown = `# 图片资源检查报告

## 概述
- 检查时间: ${report.timestamp.toLocaleString()}
- 总图片数: ${report.totalImages}
- 成功加载: ${report.successfulImages}
- 加载失败: ${report.failedImages}
- 失败率: ${((report.failedImages / report.totalImages) * 100).toFixed(2)}%

## 失败图片详情

`;

    const failedResults = report.results.filter(r => r.error);
    
    if (failedResults.length === 0) {
      markdown += '所有图片均成功加载！\n';
    } else {
      failedResults.forEach(result => {
        markdown += `### ${result.url}\n`;
        markdown += `- 页面位置: ${result.page}\n`;
        markdown += `- 错误: ${result.error}\n`;
        markdown += `- 错误类型: ${result.errorType}\n`;
        markdown += `- 原因: ${result.reason}\n`;
        markdown += `- 检查时间: ${result.timestamp.toLocaleString()}\n\n`;
      });
    }

    // 添加成功图片列表
    const successResults = report.results.filter(r => !r.error);
    if (successResults.length > 0) {
      markdown += '## 成功加载的图片\n\n';
      successResults.forEach(result => {
        markdown += `- ${result.url}\n`;
      });
    }

    fs.writeFileSync(reportPath, markdown, 'utf8');
    console.log(`人类可读报告已保存到: ${reportPath}`);
  }

  // 递归扫描目录
  _scanDirectory(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        // 跳过某些目录
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build' || entry.name === 'coverage') {
          continue;
        }
        this._scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (this.supportedExtensions.includes(ext)) {
          this.filesToCheck.push(fullPath);
        }
      }
    }
  }

  // 从文件中提取图片URL
  _extractImageUrls() {
    const imageUrlRegex = /\bsrc=["']([^"']+)["']|\burl\(["']?([^"')]+)["']?\)|\bbackground-image:\s*url\(["']?([^"')]+)["']?\)|\bimageUrl\s*=\s*["']([^"']+)["']|\bimg\s+[^>]*src=["']([^"']+)["']/gi;
    
    for (const file of this.filesToCheck) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        
        while ((match = imageUrlRegex.exec(content)) !== null) {
          // 提取匹配的URL
          for (let i = 1; i < match.length; i++) {
            if (match[i]) {
              const url = match[i].trim();
              // 过滤掉无效URL和base64图片
              if (url && !url.startsWith('data:')) {
                this.imageUrls.add(url);
              }
              break;
            }
          }
        }
      } catch (error) {
        console.error(`读取文件失败: ${file}`, error);
      }
    }
  }
}

// 主函数
async function main() {
  const checker = new ImageChecker();
  
  // 扫描项目
  checker.scanProject(process.cwd());
  
  // 检查所有图片
  await checker.checkAllImages();
  
  // 生成报告
  checker.generateReport();
  
  console.log('图片检查完成！');
}

// 执行主函数
main().catch(error => {
  console.error('图片检查过程中发生错误:', error);
  process.exit(1);
});
