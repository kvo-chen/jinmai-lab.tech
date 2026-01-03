/**
 * 浏览器环境Node.js模块Mock
 * 提供浏览器兼容的API实现
 */

// fs模块Mock
export const fs = {
  readFileSync: () => { throw new Error('fs.readFileSync is not available in browser'); },
  writeFileSync: () => { throw new Error('fs.writeFileSync is not available in browser'); },
  existsSync: () => false,
  mkdirSync: () => { throw new Error('fs.mkdirSync is not available in browser'); },
  readdirSync: () => [],
  statSync: () => ({ isDirectory: () => false, isFile: () => false }),
  createReadStream: () => { throw new Error('fs.createReadStream is not available in browser'); },
  createWriteStream: () => { throw new Error('fs.createWriteStream is not available in browser'); }
};

export default fs;