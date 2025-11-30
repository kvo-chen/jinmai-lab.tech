export const promptTemplates = [
  { id: 'tpl-1', name: '青花瓷海报', text: '生成融合青花瓷纹样的中秋主题海报，色调以靛蓝与白为主，加入月亮与桂花元素，风格现代简约。' },
  { id: 'tpl-2', name: '国潮包装', text: '设计一款国潮风格零食包装，融入云纹与回纹，色彩采用中国红与金色，突出年轻化与传统融合。' },
  { id: 'tpl-3', name: '老字号焕新', text: '为天津老字号品牌做视觉焕新，结合历史故事与现代审美，使用经典纹样做装饰。' },
  { id: 'tpl-4', name: '节日限定', text: '创作春节限定礼盒设计，包含剪纸元素与灯笼符号，整体喜庆但不过度拥挤。' },
  { id: 'tpl-5', name: '非遗传承', text: '围绕杨柳青年画进行现代演绎的插画海报，保留传统色彩与构图原则。' },
  { id: 'tpl-6', name: '城市文化', text: '以海河两岸为主题做城市文化宣传画，融合历史建筑与现代艺术表现。' }
];

export type PromptTemplate = typeof promptTemplates[number];
