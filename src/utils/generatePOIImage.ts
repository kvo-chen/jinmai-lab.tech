// 生成POI图片的工具函数
// 用于创建统一风格的SVG占位图

/**
 * 生成POI的SVG图片URL
 * @param name POI名称
 * @param subtitle POI副标题
 * @param type 图片类型 (1: 主要展示, 2: 特色展示, 3: 历史展示)
 * @returns SVG图片的data URL
 */
export function generatePOIImage(
  name: string,
  subtitle: string,
  type: 1 | 2 | 3 = 1
): string {
  // 统一的色彩方案
  const bgGradient = 'linearGradient(id="bgGradient" x1="0%25" y1="0%25" x2="100%25" y2="100%25")';
  const bgGradientStops = '<stop offset="0%25" style="stop-color:%23FFD700;stop-opacity:1" /><stop offset="100%25" style="stop-color:%23FFA500;stop-opacity:1" />';
  const primaryColor = '%23FF6B35'; // 主色调
  const secondaryColor = '%236B7280'; // 辅助色
  const accentColor = '%23FFD700'; // 强调色

  // 根据类型生成不同的装饰元素
  let decoration = '';
  switch (type) {
    case 1:
      // 主要展示 - 三个圆形
      decoration = `
        <circle cx="200" cy="400" r="40" fill="${primaryColor}"/>
        <circle cx="400" cy="400" r="40" fill="${primaryColor}"/>
        <circle cx="600" cy="400" r="40" fill="${primaryColor}"/>
      `;
      break;
    case 2:
      // 特色展示 - 波浪线
      decoration = `
        <path d="M200,400 Q300,350 400,400 T600,400" stroke="${primaryColor}" stroke-width="12" fill="none"/>
        <path d="M200,400 Q300,450 400,400 T600,400" stroke="${primaryColor}" stroke-width="12" fill="none"/>
      `;
      break;
    case 3:
      // 历史展示 - 矩形标签
      decoration = `
        <rect x="250" y="380" width="300" height="60" rx="30" fill="${primaryColor}"/>
        <text x="400" y="420" font-family="Arial" font-size="28" font-weight="bold" fill="white" text-anchor="middle" dy="0.3em">
          历史悠久
        </text>
      `;
      break;
  }

  // 构建完整的SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <${bgGradient}>${bgGradientStops}</${bgGradient}>
      </defs>
      <rect width="800" height="600" fill="url(%23bgGradient)"/>
      <rect x="100" y="100" width="600" height="400" rx="20" fill="rgba(255,255,255,0.9)" stroke="${accentColor}" stroke-width="4"/>
      <text x="400" y="250" font-family="Arial" font-size="48" font-weight="bold" fill="${primaryColor}" text-anchor="middle" dy="0.3em">
        ${name}
      </text>
      <text x="400" y="320" font-family="Arial" font-size="24" fill="${secondaryColor}" text-anchor="middle" dy="0.3em">
        ${subtitle}
      </text>
      ${decoration}
    </svg>
  `;

  // 返回data URL
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

/**
 * 为POI生成多张不同类型的图片
 * @param name POI名称
 * @param subtitle POI副标题
 * @returns 包含三张不同类型图片的数组
 */
export function generatePOIImages(name: string, subtitle: string): string[] {
  return [
    generatePOIImage(name, subtitle, 1), // 主要展示
    generatePOIImage(name, subtitle, 2), // 特色展示
    generatePOIImage(name, subtitle, 3)  // 历史展示
  ];
}
