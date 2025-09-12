export type BrowserEngine = "puppeteer" | "playwright" | "cheerio";

export interface SkyscraperOptions {
  engine?: BrowserEngine;
  headless?: boolean;
  timeout?: number;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  retries?: number;
  delay?: number;
  concurrency?: number;
}

export interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  data?: any;
  timeout?: number;
  retries?: number;
}

export interface SelectorOptions {
  selector: string;
  attribute?: string;
  text?: boolean;
  html?: boolean;
  multiple?: boolean;
}

export interface ScrapingResult {
  url: string;
  data: any;
  success: boolean;
  timestamp: Date;
  metadata?: {
    title?: string;
    statusCode?: number;
    responseTime?: number;
    contentLength?: number;
  };
}

export interface ScrapingError {
  url: string;
  error: string;
  timestamp: Date;
  retryCount?: number;
}

export interface ScrapingConfig {
  urls: string[];
  selectors: SelectorOptions[];
  options?: SkyscraperOptions;
  onSuccess?: (result: ScrapingResult) => void;
  onError?: (error: ScrapingError) => void;
  onComplete?: (results: ScrapingResult[], errors: ScrapingError[]) => void;
}
