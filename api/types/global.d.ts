// Allow importing .mjs files
declare module '*.mjs' {
  const content: any;
  export = content;
}

// Declare process global for Node.js
declare namespace NodeJS {
  interface ProcessEnv {
    CORS_ALLOW_ORIGIN?: string;
    NODE_ENV?: 'development' | 'production' | 'test';
    [key: string]: string | undefined;
  }
}

declare const process: NodeJS.Process;

// Declare Vercel types if needed
declare module 'vercel' {
  export interface VercelRequest {
    body: any;
    method: string;
    headers: Record<string, string>;
    query: Record<string, string | string[]>;
  }
  
  export interface VercelResponse {
    status: (code: number) => VercelResponse;
    json: (data: any) => VercelResponse;
    end: () => void;
    setHeader: (name: string, value: string) => VercelResponse;
  }
}
