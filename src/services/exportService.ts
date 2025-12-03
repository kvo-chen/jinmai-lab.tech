/**
 * 作品导出服务 - 提供跨平台作品导出功能
 */

// 导出格式类型
export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf' | 'json' | 'markdown' | 'text';

// 作品导出选项
export interface ExportOptions {
  format: ExportFormat;
  resolution?: 'low' | 'medium' | 'high';
  quality?: number; // 0-1，仅适用于图片格式
  includeMetadata?: boolean;
  includeComments?: boolean;
  includeCulturalElements?: boolean;
  includeColorScheme?: boolean;
  includeToolsUsed?: boolean;
}

// 作品数据接口
export interface ExportableWork {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  tags: string[];
  culturalElements: string[];
  colorScheme: string[];
  toolsUsed: string[];
  date: string;
  author: string;
  likes: number;
  views: number;
  comments?: Array<{
    id: string;
    content: string;
    author: string;
    date: string;
  }>;
}

// 导出服务类
class ExportService {
  /**
   * 导出作品
   * @param work 作品数据
   * @param options 导出选项
   */
  exportWork(work: ExportableWork, options: ExportOptions): void {
    switch (options.format) {
      case 'png':
      case 'jpg':
        this.exportAsImage(work, options);
        break;
      case 'svg':
        this.exportAsSVG(work, options);
        break;
      case 'pdf':
        this.exportAsPDF(work, options);
        break;
      case 'json':
        this.exportAsJSON(work, options);
        break;
      case 'markdown':
        this.exportAsMarkdown(work, options);
        break;
      case 'text':
        this.exportAsText(work, options);
        break;
    }
  }

  /**
   * 导出为图片格式
   */
  private exportAsImage(work: ExportableWork, options: ExportOptions): void {
    // 处理图片导出逻辑
    // 这里使用简单的实现，实际项目中可能需要更复杂的处理
    if (work.images.length > 0) {
      // 下载第一张图片作为示例
      this.downloadFile(work.images[0], `${work.title}.${options.format}`);
    }
  }

  /**
   * 导出为SVG格式
   */
  private exportAsSVG(work: ExportableWork, options: ExportOptions): void {
    // 处理SVG导出逻辑
    const svgContent = this.generateSVGContent(work, options);
    this.downloadFileFromContent(svgContent, `${work.title}.svg`, 'image/svg+xml');
  }

  /**
   * 导出为PDF格式
   */
  private exportAsPDF(work: ExportableWork, options: ExportOptions): void {
    // 处理PDF导出逻辑
    const pdfContent = this.generatePDFContent(work, options);
    this.downloadFileFromContent(pdfContent, `${work.title}.pdf`, 'application/pdf');
  }

  /**
   * 导出为JSON格式
   */
  private exportAsJSON(work: ExportableWork, options: ExportOptions): void {
    // 处理JSON导出逻辑
    const jsonContent = this.generateJSONContent(work, options);
    this.downloadFileFromContent(jsonContent, `${work.title}.json`, 'application/json');
  }

  /**
   * 导出为Markdown格式
   */
  private exportAsMarkdown(work: ExportableWork, options: ExportOptions): void {
    // 处理Markdown导出逻辑
    const markdownContent = this.generateMarkdownContent(work, options);
    this.downloadFileFromContent(markdownContent, `${work.title}.md`, 'text/markdown');
  }

  /**
   * 导出为纯文本格式
   */
  private exportAsText(work: ExportableWork, options: ExportOptions): void {
    // 处理纯文本导出逻辑
    const textContent = this.generateTextContent(work, options);
    this.downloadFileFromContent(textContent, `${work.title}.txt`, 'text/plain');
  }

  /**
   * 生成SVG内容
   */
  private generateSVGContent(work: ExportableWork, options: ExportOptions): string {
    // 生成简单的SVG内容作为示例
    return `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="#f0f0f0" />
  <text x="400" y="50" font-size="24" text-anchor="middle" fill="#333">${work.title}</text>
  <text x="400" y="80" font-size="16" text-anchor="middle" fill="#666">${work.description}</text>
  <!-- 实际项目中可能会包含更复杂的SVG内容 -->
</svg>`;
  }

  /**
   * 生成PDF内容
   */
  private generatePDFContent(work: ExportableWork, options: ExportOptions): string {
    // 生成简单的PDF内容作为示例
    // 实际项目中可能需要使用专门的PDF生成库
    return `%PDF-1.4
%¥±ë
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 24 Tf
100 700 Td
(${work.title}) Tj
ET
BT
/F1 12 Tf
100 680 Td
(${work.description}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000095 00000 n 
0000000167 00000 n 
0000000335 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
410
%%EOF`;
  }

  /**
   * 生成JSON内容
   */
  private generateJSONContent(work: ExportableWork, options: ExportOptions): string {
    // 生成完整的JSON内容
    return JSON.stringify(work, null, 2);
  }

  /**
   * 生成Markdown内容
   */
  private generateMarkdownContent(work: ExportableWork, options: ExportOptions): string {
    // 生成Markdown内容
    let content = `# ${work.title}

`;
    content += `## 描述

${work.description}

`;
    content += `## 基本信息

`;
    content += `- **分类**: ${work.category}
`;
    content += `- **标签**: ${work.tags.join(', ')}
`;
    content += `- **创作日期**: ${work.date}
`;
    content += `- **作者**: ${work.author}
`;
    content += `- **点赞数**: ${work.likes}
`;
    content += `- **浏览量**: ${work.views}

`;

    if (options.includeCulturalElements && work.culturalElements.length > 0) {
      content += `## 文化元素

${work.culturalElements.map(el => `- ${el}`).join('\n')}

`;
    }

    if (options.includeColorScheme && work.colorScheme.length > 0) {
      content += `## 配色方案

${work.colorScheme.map(color => `- ${color}`).join('\n')}

`;
    }

    if (options.includeToolsUsed && work.toolsUsed.length > 0) {
      content += `## 使用工具

${work.toolsUsed.map(tool => `- ${tool}`).join('\n')}

`;
    }

    if (options.includeComments && work.comments && work.comments.length > 0) {
      content += `## 评论

`;
      work.comments.forEach(comment => {
        content += `### ${comment.author} (${comment.date})

${comment.content}

`;
      });
    }

    if (work.images.length > 0) {
      content += `## 作品图片

`;
      work.images.forEach((image, index) => {
        content += `![作品图片${index + 1}](${image})

`;
      });
    }

    return content;
  }

  /**
   * 生成纯文本内容
   */
  private generateTextContent(work: ExportableWork, options: ExportOptions): string {
    // 生成纯文本内容
    let content = `${work.title}\n\n`;
    content += `${work.description}\n\n`;
    content += `基本信息:\n`;
    content += `- 分类: ${work.category}\n`;
    content += `- 标签: ${work.tags.join(', ')}\n`;
    content += `- 创作日期: ${work.date}\n`;
    content += `- 作者: ${work.author}\n`;
    content += `- 点赞数: ${work.likes}\n`;
    content += `- 浏览量: ${work.views}\n\n`;

    if (options.includeCulturalElements && work.culturalElements.length > 0) {
      content += `文化元素:\n${work.culturalElements.map(el => `- ${el}`).join('\n')}\n\n`;
    }

    if (options.includeColorScheme && work.colorScheme.length > 0) {
      content += `配色方案:\n${work.colorScheme.map(color => `- ${color}`).join('\n')}\n\n`;
    }

    if (options.includeToolsUsed && work.toolsUsed.length > 0) {
      content += `使用工具:\n${work.toolsUsed.map(tool => `- ${tool}`).join('\n')}\n\n`;
    }

    if (work.images.length > 0) {
      content += `作品图片:\n${work.images.join('\n')}\n`;
    }

    return content;
  }

  /**
   * 下载文件
   */
  private downloadFile(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * 从内容下载文件
   */
  private downloadFileFromContent(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    this.downloadFile(url, filename);
    URL.revokeObjectURL(url);
  }

  /**
   * 批量导出作品
   */
  batchExport(works: ExportableWork[], options: ExportOptions): void {
    works.forEach((work, index) => {
      const batchOptions = { ...options, resolution: options.resolution || 'medium' };
      this.exportWork(work, batchOptions);
      // 为避免浏览器阻塞，添加适当延迟
      if (index < works.length - 1) {
        setTimeout(() => {}, 500);
      }
    });
  }

  /**
   * 获取支持的导出格式
   */
  getSupportedFormats(): ExportFormat[] {
    return ['png', 'jpg', 'svg', 'pdf', 'json', 'markdown', 'text'];
  }

  /**
   * 获取格式的MIME类型
   */
  getFormatMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      json: 'application/json',
      markdown: 'text/markdown',
      text: 'text/plain'
    };
    return mimeTypes[format];
  }
}

// 导出单例实例
export default new ExportService();
