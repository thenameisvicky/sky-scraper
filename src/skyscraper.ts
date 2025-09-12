import {
  SkyscraperOptions,
  ScrapingResult,
  ScrapingError,
  ScrapingConfig,
  SelectorOptions,
  RequestOptions,
  BrowserEngine,
} from "./types";

export class Skyscraper {
  private options: Required<SkyscraperOptions>;
  private browser: any;
  private page: any;

  constructor(options: SkyscraperOptions = {}) {
    this.options = {
      engine: options.engine || "puppeteer",
      headless: options.headless !== false,
      timeout: options.timeout || 30000,
      userAgent:
        options.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      viewport: options.viewport || { width: 1920, height: 1080 },
      proxy: options.proxy,
      retries: options.retries || 3,
      delay: options.delay || 1000,
      concurrency: options.concurrency || 1,
    };
  }

  /**
   * Initialize the browser instance
   */
  async init(): Promise<void> {
    try {
      switch (this.options.engine) {
        case "puppeteer":
          await this.initPuppeteer();
          break;
        case "playwright":
          await this.initPlaywright();
          break;
        case "cheerio":
          // Cheerio doesn't need browser initialization
          break;
        default:
          throw new Error(`Unsupported browser engine: ${this.options.engine}`);
      }
    } catch (error) {
      throw new Error(`Failed to initialize browser: ${error}`);
    }
  }

  /**
   * Initialize Puppeteer browser
   */
  private async initPuppeteer(): Promise<void> {
    const puppeteer = require("puppeteer");
    this.browser = await puppeteer.launch({
      headless: this.options.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport(this.options.viewport);
    await this.page.setUserAgent(this.options.userAgent);
  }

  /**
   * Initialize Playwright browser
   */
  private async initPlaywright(): Promise<void> {
    const { chromium } = require("playwright");
    this.browser = await chromium.launch({
      headless: this.options.headless,
    });
    this.page = await this.browser.newPage();
    await this.page.setViewportSize(this.options.viewport);
    await this.page.setExtraHTTPHeaders({
      "User-Agent": this.options.userAgent,
    });
  }

  /**
   * Scrape a single URL
   */
  async scrapeUrl(
    url: string,
    selectors: SelectorOptions[] = []
  ): Promise<ScrapingResult> {
    const startTime = Date.now();

    try {
      if (this.options.engine === "cheerio") {
        return await this.scrapeWithCheerio(url, selectors, startTime);
      } else {
        return await this.scrapeWithBrowser(url, selectors, startTime);
      }
    } catch (error) {
      return {
        url,
        data: null,
        success: false,
        timestamp: new Date(),
        metadata: {
          responseTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Scrape multiple URLs
   */
  async scrapeUrls(
    config: ScrapingConfig
  ): Promise<{ results: ScrapingResult[]; errors: ScrapingError[] }> {
    const results: ScrapingResult[] = [];
    const errors: ScrapingError[] = [];

    for (const url of config.urls) {
      try {
        const result = await this.scrapeUrl(url, config.selectors);
        results.push(result);

        if (result.success && config.onSuccess) {
          config.onSuccess(result);
        }
      } catch (error) {
        const scrapingError: ScrapingError = {
          url,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        };
        errors.push(scrapingError);

        if (config.onError) {
          config.onError(scrapingError);
        }
      }

      // Add delay between requests
      if (this.options.delay > 0) {
        await this.delay(this.options.delay);
      }
    }

    if (config.onComplete) {
      config.onComplete(results, errors);
    }

    return { results, errors };
  }

  /**
   * Scrape using Puppeteer/Playwright
   */
  private async scrapeWithBrowser(
    url: string,
    selectors: SelectorOptions[],
    startTime: number
  ): Promise<ScrapingResult> {
    await this.page.goto(url, {
      waitUntil: "networkidle2",
      timeout: this.options.timeout,
    });

    const data: any = {};

    for (const selectorConfig of selectors) {
      try {
        if (selectorConfig.multiple) {
          data[selectorConfig.selector] = await this.page.$$eval(
            selectorConfig.selector,
            (elements: any[], config: SelectorOptions) => {
              return elements.map((el) => {
                if (config.text) return el.textContent?.trim();
                if (config.html) return el.innerHTML;
                if (config.attribute) return el.getAttribute(config.attribute);
                return el.textContent?.trim();
              });
            },
            selectorConfig
          );
        } else {
          data[selectorConfig.selector] = await this.page.$eval(
            selectorConfig.selector,
            (element: any, config: SelectorOptions) => {
              if (config.text) return element.textContent?.trim();
              if (config.html) return element.innerHTML;
              if (config.attribute)
                return element.getAttribute(config.attribute);
              return element.textContent?.trim();
            },
            selectorConfig
          );
        }
      } catch (error) {
        data[selectorConfig.selector] = null;
      }
    }

    const title = await this.page.title();
    const response = await this.page.response();
    const statusCode = response?.status();

    return {
      url,
      data,
      success: true,
      timestamp: new Date(),
      metadata: {
        title,
        statusCode,
        responseTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Scrape using Cheerio
   */
  private async scrapeWithCheerio(
    url: string,
    selectors: SelectorOptions[],
    startTime: number
  ): Promise<ScrapingResult> {
    const axios = require("axios");
    const cheerio = require("cheerio");

    const response = await axios.get(url, {
      timeout: this.options.timeout,
      headers: {
        "User-Agent": this.options.userAgent,
      },
    });

    const $ = cheerio.load(response.data);
    const data: any = {};

    for (const selectorConfig of selectors) {
      try {
        if (selectorConfig.multiple) {
          data[selectorConfig.selector] = $(selectorConfig.selector)
            .map((i: number, el: any) => {
              const element = $(el);
              if (selectorConfig.text) return element.text().trim();
              if (selectorConfig.html) return element.html();
              if (selectorConfig.attribute)
                return element.attr(selectorConfig.attribute);
              return element.text().trim();
            })
            .get();
        } else {
          const element = $(selectorConfig.selector);
          if (selectorConfig.text)
            data[selectorConfig.selector] = element.text().trim();
          else if (selectorConfig.html)
            data[selectorConfig.selector] = element.html();
          else if (selectorConfig.attribute)
            data[selectorConfig.selector] = element.attr(
              selectorConfig.attribute
            );
          else data[selectorConfig.selector] = element.text().trim();
        }
      } catch (error) {
        data[selectorConfig.selector] = null;
      }
    }

    return {
      url,
      data,
      success: true,
      timestamp: new Date(),
      metadata: {
        title: $("title").text(),
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        contentLength: response.data.length,
      },
    };
  }

  /**
   * Make HTTP requests
   */
  async request(options: RequestOptions): Promise<any> {
    const axios = require("axios");

    try {
      const response = await axios({
        url: options.url,
        method: options.method || "GET",
        headers: options.headers,
        data: options.data,
        timeout: options.timeout || this.options.timeout,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Get current options
   */
  getOptions(): SkyscraperOptions {
    return { ...this.options };
  }

  /**
   * Update options
   */
  updateOptions(newOptions: Partial<SkyscraperOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}
