import { expect } from "chai";
import { Skyscraper } from "../src/skyscraper";
import { SkyscraperOptions, SelectorOptions } from "../src/types";

describe("Skyscraper", () => {
  let scraper: Skyscraper;

  beforeEach(() => {
    scraper = new Skyscraper({
      engine: "cheerio",
      timeout: 5000,
    });
  });

  afterEach(async () => {
    if (scraper) {
      await scraper.close();
    }
  });

  describe("Constructor", () => {
    it("should create a scraper instance with default options", () => {
      const defaultScraper = new Skyscraper();
      const options = defaultScraper.getOptions();

      expect(options.engine).to.equal("puppeteer");
      expect(options.headless).to.be.true;
      expect(options.timeout).to.equal(30000);
      expect(options.retries).to.equal(3);
    });

    it("should create a scraper instance with custom options", () => {
      const customOptions: SkyscraperOptions = {
        engine: "cheerio",
        headless: false,
        timeout: 10000,
        retries: 5,
      };

      const customScraper = new Skyscraper(customOptions);
      const options = customScraper.getOptions();

      expect(options.engine).to.equal("cheerio");
      expect(options.headless).to.be.false;
      expect(options.timeout).to.equal(10000);
      expect(options.retries).to.equal(5);
    });
  });

  describe("Options Management", () => {
    it("should get current options", () => {
      const options = scraper.getOptions();
      expect(options).to.be.an("object");
      expect(options).to.have.property("engine");
      expect(options).to.have.property("headless");
      expect(options).to.have.property("timeout");
    });

    it("should update options", () => {
      const newOptions = {
        timeout: 15000,
        retries: 2,
      };

      scraper.updateOptions(newOptions);
      const updatedOptions = scraper.getOptions();

      expect(updatedOptions.timeout).to.equal(15000);
      expect(updatedOptions.retries).to.equal(2);
    });
  });

  describe("Initialization", () => {
    it("should initialize cheerio engine without errors", async () => {
      await expect(scraper.init()).to.be.fulfilled;
    });

    it("should throw error for unsupported engine", async () => {
      const invalidScraper = new Skyscraper({ engine: "invalid" as any });
      await expect(invalidScraper.init()).to.be.rejectedWith(
        "Unsupported browser engine"
      );
    });
  });

  describe("HTTP Requests", () => {
    it("should make successful GET request", async () => {
      await scraper.init();

      const result = await scraper.request({
        url: "https://httpbin.org/json",
        method: "GET",
      });

      expect(result).to.be.an("object");
      expect(result).to.have.property("slideshow");
    });

    it("should handle request errors", async () => {
      await scraper.init();

      await expect(
        scraper.request({
          url: "https://invalid-url-that-does-not-exist.com",
          method: "GET",
        })
      ).to.be.rejected;
    });
  });

  describe("URL Scraping", () => {
    beforeEach(async () => {
      await scraper.init();
    });

    it("should scrape a simple HTML page", async () => {
      const selectors: SelectorOptions[] = [
        { selector: "title", text: true },
        { selector: "h1", text: true },
      ];

      const result = await scraper.scrapeUrl(
        "https://httpbin.org/html",
        selectors
      );

      expect(result).to.be.an("object");
      expect(result.success).to.be.true;
      expect(result.url).to.equal("https://httpbin.org/html");
      expect(result.data).to.be.an("object");
      expect(result.timestamp).to.be.instanceOf(Date);
    });

    it("should handle scraping errors gracefully", async () => {
      const selectors: SelectorOptions[] = [{ selector: "title", text: true }];

      const result = await scraper.scrapeUrl(
        "https://invalid-url.com",
        selectors
      );

      expect(result).to.be.an("object");
      expect(result.success).to.be.false;
      expect(result.url).to.equal("https://invalid-url.com");
      expect(result.data).to.be.null;
    });

    it("should extract multiple elements", async () => {
      const selectors: SelectorOptions[] = [
        { selector: "a", text: true, multiple: true },
      ];

      const result = await scraper.scrapeUrl(
        "https://httpbin.org/html",
        selectors
      );

      expect(result.success).to.be.true;
      expect(result.data.a).to.be.an("array");
    });

    it("should extract attributes", async () => {
      const selectors: SelectorOptions[] = [
        { selector: "a", attribute: "href", multiple: true },
      ];

      const result = await scraper.scrapeUrl(
        "https://httpbin.org/html",
        selectors
      );

      expect(result.success).to.be.true;
      expect(result.data.a).to.be.an("array");
    });
  });

  describe("Batch Scraping", () => {
    beforeEach(async () => {
      await scraper.init();
    });

    it("should scrape multiple URLs", async () => {
      const urls = ["https://httpbin.org/html", "https://httpbin.org/json"];

      const selectors: SelectorOptions[] = [{ selector: "title", text: true }];

      const { results, errors } = await scraper.scrapeUrls({
        urls,
        selectors,
      });

      expect(results).to.be.an("array");
      expect(errors).to.be.an("array");
      expect(results.length + errors.length).to.equal(urls.length);
    });

    it("should call success callback for each successful scrape", async () => {
      let successCount = 0;

      const { results } = await scraper.scrapeUrls({
        urls: ["https://httpbin.org/html"],
        selectors: [{ selector: "title", text: true }],
        onSuccess: () => {
          successCount++;
        },
      });

      expect(successCount).to.equal(1);
      expect(results.length).to.equal(1);
    });

    it("should call error callback for each failed scrape", async () => {
      let errorCount = 0;

      const { errors } = await scraper.scrapeUrls({
        urls: ["https://invalid-url.com"],
        selectors: [{ selector: "title", text: true }],
        onError: () => {
          errorCount++;
        },
      });

      expect(errorCount).to.equal(1);
      expect(errors.length).to.equal(1);
    });
  });

  describe("Cleanup", () => {
    it("should close browser without errors", async () => {
      await scraper.init();
      await expect(scraper.close()).to.be.fulfilled;
    });

    it("should handle multiple close calls gracefully", async () => {
      await scraper.init();
      await scraper.close();
      await expect(scraper.close()).to.be.fulfilled;
    });
  });
});
