/**
 * 浏览器环境Node.js模块Mock
 * 提供浏览器兼容的API实现
 */

// 数据库驱动Mock
export class DatabaseMock {
  constructor() {
    throw new Error('Database drivers are not available in browser environment');
  }
}

export const betterSqlite3 = DatabaseMock;
export const mongodb = DatabaseMock;
export const pg = DatabaseMock;
export const neonDatabase = DatabaseMock;

// 导出兼容的对象
export default {
  betterSqlite3,
  mongodb,
  pg,
  neonDatabase
};