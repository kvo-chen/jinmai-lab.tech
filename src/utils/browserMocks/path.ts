/**
 * 浏览器环境Node.js模块Mock
 * 提供浏览器兼容的API实现
 */

// path模块Mock
export const path = {
  resolve: (...paths: string[]) => paths.join('/'),
  join: (...paths: string[]) => paths.join('/'),
  dirname: (path: string) => path.split('/').slice(0, -1).join('/') || '/',
  basename: (path: string) => path.split('/').pop() || '',
  extname: (path: string) => {
    const basename = path.split('/').pop() || '';
    const index = basename.lastIndexOf('.');
    return index === -1 ? '' : basename.slice(index);
  },
  isAbsolute: (path: string) => path.startsWith('/'),
  relative: (from: string, to: string) => {
    // 简化的相对路径计算
    return to.replace(from, '').replace(/^\//, '');
  },
  parse: function(path: string) {
    const basename = path.split('/').pop() || '';
    const ext = this.extname(path);
    const name = basename.slice(0, -ext.length);
    const dir = this.dirname(path);
    
    return {
      root: path.startsWith('/') ? '/' : '',
      dir,
      base: basename,
      ext,
      name
    };
  },
  sep: '/',
  delimiter: ':'
};

export default path;