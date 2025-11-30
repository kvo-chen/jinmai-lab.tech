/**
 * 方言服务模块 - 提供天津方言相关功能
 */

/**
 * 天津方言词库
 */
const tianjinDialectDictionary: Record<string, string> = {
  '嘛呀': '什么',
  '结界': '地方、区域',
  '倍儿好': '非常好、特别好',
  '介似嘛': '这是什么',
  '逗你玩儿': '开玩笑、逗乐',
  '嘛钱不钱，乐呵乐呵得了': '不要太在意金钱，开心最重要',
  '嘛钱不钱乐呵乐呵得了': '不要太在意金钱，开心最重要',
  '干嘛': '做什么',
  '嘛事儿': '什么事情',
  '就介意思': '就是这个意思',
  '介小子': '这个小伙子',
  '介闺女': '这个姑娘',
  '得嘞': '好的、没问题',
  '哏儿': '有趣、好玩',
  '真哏儿': '真有趣',
  '嘛都不懂': '什么都不懂',
  '嘛时候': '什么时候',
  '就嘛意思': '就是这个意思',
  '介地儿': '这个地方',
  '恁么了': '怎么了',
  '瞎掰': '胡说、撒谎',
  '逗闷子': '开玩笑、逗乐',
  '起腻': '纠缠、撒娇',
  '显摆': '炫耀',
  '得亏': '幸亏',
  '滋要是': '只要是',
  '嘛钱不钱乐呵乐呵': '不要太在意金钱，开心最重要'
};

/**
 * 方言服务类
 */
class DialectService {
  /**
   * 将天津方言翻译为普通话
   * @param dialect 天津方言文本
   * @returns 翻译后的普通话文本
   */
  translateToMandarin(dialect: string): string {
    let translated = dialect;
    
    // 遍历词库，替换方言词汇
    Object.keys(tianjinDialectDictionary).forEach(dialectWord => {
      const mandarinWord = tianjinDialectDictionary[dialectWord];
      // 创建正则表达式，确保全词匹配
      const regex = new RegExp(`\\b${dialectWord}\\b`, 'gi');
      translated = translated.replace(regex, mandarinWord);
    });
    
    return translated;
  }
  
  /**
   * 检测文本中是否包含天津方言
   * @param text 输入文本
   * @returns 是否包含天津方言
   */
  containsTianjinDialect(text: string): boolean {
    // 检查是否包含任何方言词汇
    return Object.keys(tianjinDialectDictionary).some(dialectWord => 
      text.toLowerCase().includes(dialectWord.toLowerCase())
    );
  }
  
  /**
   * 获取文本中的天津方言词汇列表
   * @param text 输入文本
   * @returns 方言词汇列表
   */
  getDialectWordsInText(text: string): Array<{word: string, meaning: string}> {
    const result: Array<{word: string, meaning: string}> = [];
    
    // 查找文本中包含的所有方言词汇
    Object.keys(tianjinDialectDictionary).forEach(dialectWord => {
      if (text.toLowerCase().includes(dialectWord.toLowerCase())) {
        result.push({
          word: dialectWord,
          meaning: tianjinDialectDictionary[dialectWord]
        });
      }
    });
    
    return result;
  }
  
  /**
   * 将普通话转换为天津方言风格
   * 注意：这只是简单的示例转换，真实的方言转换需要更复杂的逻辑
   * @param mandarin 普通话文本
   * @returns 方言风格文本
   */
  convertToTianjinStyle(mandarin: string): string {
    let result = mandarin;
    
    // 简单的词汇替换
    const replacements: Record<string, string> = {
      '什么': '嘛',
      '这个地方': '介地儿',
      '非常好': '倍儿好',
      '开玩笑': '逗闷子',
      '怎么了': '恁么了',
      '没有问题': '得嘞',
      '炫耀': '显摆',
      '有趣': '哏儿',
      '只要': '滋要是',
      '幸亏': '得亏'
    };
    
    // 替换词汇
    Object.keys(replacements).forEach(mandarinWord => {
      const dialectWord = replacements[mandarinWord];
      const regex = new RegExp(`\\b${mandarinWord}\\b`, 'gi');
      result = result.replace(regex, dialectWord);
    });
    
    // 添加天津方言特有的语气词
    if (result.endsWith('。') || result.endsWith('！') || result.endsWith('？')) {
      result = result.slice(0, -1) + '啊';
    }
    
    return result;
  }
}

// 导出单例实例
export default new DialectService();