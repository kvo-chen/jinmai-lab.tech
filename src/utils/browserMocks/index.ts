/**
 * 浏览器环境Node.js模块Mock
 * 提供浏览器兼容的API实现
 */

// 其他模块的Mock实现
export const stream = {
  Readable: class {
    constructor() {
      throw new Error('stream.Readable is not available in browser environment');
    }
  },
  Writable: class {
    constructor() {
      throw new Error('stream.Writable is not available in browser environment');
    }
  },
  Transform: class {
    constructor() {
      throw new Error('stream.Transform is not available in browser environment');
    }
  }
};

export const util = {
  promisify: (fn: Function) => {
    return (...args: any[]) => {
      return new Promise((resolve, reject) => {
        fn(...args, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };
  },
  
  callbackify: (fn: Function) => {
    return (...args: any[]) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        fn(...args.slice(0, -1))
          .then((result: any) => callback(null, result))
          .catch((error: any) => callback(error));
      } else {
        return fn(...args);
      }
    };
  }
};

export const os = {
  platform: () => 'browser',
  arch: () => 'javascript',
  release: () => '1.0.0',
  type: () => 'Browser',
  cpus: () => [{ model: 'Browser CPU', speed: 0, times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 } }],
  totalmem: () => 0,
  freemem: () => 0,
  endianness: () => 'LE',
  hostname: () => 'localhost',
  homedir: () => '/',
  tmpdir: () => '/tmp',
  userInfo: () => ({ username: 'user', uid: 0, gid: 0, shell: null, homedir: '/' })
};

export const url = {
  parse: (urlStr: string) => {
    try {
      return new URL(urlStr);
    } catch {
      return null;
    }
  },
  format: (urlObj: URL) => urlObj.toString(),
  resolve: (from: string, to: string) => new URL(to, from).toString(),
  pathToFileURL: (path: string) => new URL(`file://${path}`),
  fileURLToPath: (url: string) => new URL(url).pathname
};

export const net = {
  Socket: class {
    constructor() {
      throw new Error('net.Socket is not available in browser environment');
    }
  },
  Server: class {
    constructor() {
      throw new Error('net.Server is not available in browser environment');
    }
  }
};

export const tls = {
  connect: () => {
    throw new Error('tls.connect is not available in browser environment');
  },
  createServer: () => {
    throw new Error('tls.createServer is not available in browser environment');
  }
};

export const child_process = {
  spawn: () => {
    throw new Error('child_process.spawn is not available in browser environment');
  },
  exec: () => {
    throw new Error('child_process.exec is not available in browser environment');
  },
  execSync: () => {
    throw new Error('child_process.execSync is not available in browser environment');
  }
};

export const cluster = {
  isMaster: true,
  isWorker: false,
  fork: () => {
    throw new Error('cluster.fork is not available in browser environment');
  },
  on: () => {
    throw new Error('cluster.on is not available in browser environment');
  }
};

export const readline = {
  createInterface: () => {
    throw new Error('readline.createInterface is not available in browser environment');
  }
};

export const querystring = {
  parse: (str: string) => {
    const params = new URLSearchParams(str);
    const result: Record<string, string> = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },
  
  stringify: (obj: Record<string, any>) => {
    return new URLSearchParams(obj).toString();
  },
  
  escape: (str: string) => encodeURIComponent(str),
  unescape: (str: string) => decodeURIComponent(str)
};

export const http = {
  createServer: () => {
    throw new Error('http.createServer is not available in browser environment');
  },
  
  request: () => {
    throw new Error('http.request is not available in browser environment');
  },
  
  get: () => {
    throw new Error('http.get is not available in browser environment');
  }
};

export const https = {
  createServer: () => {
    throw new Error('https.createServer is not available in browser environment');
  },
  
  request: () => {
    throw new Error('https.request is not available in browser environment');
  },
  
  get: () => {
    throw new Error('https.get is not available in browser environment');
  }
};

export const zlib = {
  gzip: () => {
    throw new Error('zlib.gzip is not available in browser environment');
  },
  
  gunzip: () => {
    throw new Error('zlib.gunzip is not available in browser environment');
  },
  
  constants: {
    BROTLI_PARAM_QUALITY: 0,
    Z_BEST_COMPRESSION: 9,
    Z_BEST_SPEED: 1,
    Z_DEFAULT_COMPRESSION: -1
  }
};