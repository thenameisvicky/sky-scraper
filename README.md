# skyscraper.js

A powerful, class-based web scraping library for Node.js with support for multiple browser engines and flexible configuration options.

## Features

- 🚀 **Multiple Browser Engines**: Support for Puppeteer, Playwright, and Cheerio
- 🎯 **Class-based Architecture**: Clean, object-oriented design
- ⚡ **TypeScript Support**: Full type definitions included
- 🔧 **Flexible Configuration**: Customizable options for different scraping needs
- 📊 **Batch Processing**: Scrape multiple URLs efficiently
- 🛡️ **Error Handling**: Robust error handling and retry mechanisms
- 🎨 **Modern API**: Intuitive and easy-to-use interface

## Installation

```bash
npm install skyscraper
```

## Quick Start

```typescript
import { Skyscraper } from "skyscraper";

// Create a new scraper instance
const scraper = new Skyscraper({
  engine: "puppeteer", // or 'playwright', 'cheerio'
  headless: true,
  timeout: 30000,
});

// Initialize the scraper
await scraper.init();

// Scrape a single URL
const result = await scraper.scrapeUrl("https://example.com", [
  { selector: "h1", text: true },
  { selector: ".description", text: true },
  { selector: "a", attribute: "href", multiple: true },
]);

console.log(result);

// Don't forget to close the browser
await scraper.close();
```

## API Reference

### Skyscraper Class

#### Constructor Options

```typescript
interface SkyscraperOptions {
  engine?: "puppeteer" | "playwright" | "cheerio";
  headless?: boolean;
  timeout?: number;
  userAgent?: string;
  viewport?: { width: number; height: number };
  proxy?: { server: string; username?: string; password?: string };
  retries?: number;
  delay?: number;
  concurrency?: number;
}
```

#### Methods

- `init()`: Initialize the browser instance
- `scrapeUrl(url, selectors)`: Scrape a single URL
- `scrapeUrls(config)`: Scrape multiple URLs
- `request(options)`: Make HTTP requests
- `close()`: Close the browser instance
- `getOptions()`: Get current configuration
- `updateOptions(options)`: Update configuration

### Selector Options

```typescript
interface SelectorOptions {
  selector: string; // CSS selector
  attribute?: string; // Extract specific attribute
  text?: boolean; // Extract text content
  html?: boolean; // Extract HTML content
  multiple?: boolean; // Extract multiple elements
}
```

## Examples

### Basic Scraping

```typescript
const scraper = new Skyscraper({ engine: "cheerio" });
await scraper.init();

const result = await scraper.scrapeUrl("https://news.ycombinator.com", [
  { selector: ".titleline > a", text: true, multiple: true },
  { selector: ".score", text: true, multiple: true },
]);

console.log(result.data);
```

### Batch Scraping

```typescript
const scraper = new Skyscraper({ engine: "puppeteer" });
await scraper.init();

const { results, errors } = await scraper.scrapeUrls({
  urls: ["https://example1.com", "https://example2.com"],
  selectors: [
    { selector: "title", text: true },
    { selector: 'meta[name="description"]', attribute: "content" },
  ],
  onSuccess: (result) => console.log("Success:", result.url),
  onError: (error) => console.log("Error:", error.url, error.error),
});

console.log(`Scraped ${results.length} URLs successfully`);
console.log(`Encountered ${errors.length} errors`);
```

### Using Different Engines

#### Puppeteer (Full Browser)

```typescript
const scraper = new Skyscraper({
  engine: "puppeteer",
  headless: false, // Show browser window
  viewport: { width: 1920, height: 1080 },
});
```

#### Playwright (Cross-browser)

```typescript
const scraper = new Skyscraper({
  engine: "playwright",
  headless: true,
});
```

#### Cheerio (Lightweight)

```typescript
const scraper = new Skyscraper({
  engine: "cheerio",
  timeout: 10000,
});
```

### HTTP Requests

```typescript
const scraper = new Skyscraper();

// Make API requests
const data = await scraper.request({
  url: "https://api.example.com/data",
  method: "POST",
  headers: { "Content-Type": "application/json" },
  data: { key: "value" },
});
```

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd skyscraper

# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### Scripts

- `npm run build`: Build the TypeScript code
- `npm run dev`: Watch mode for development
- `npm test`: Run tests
- `npm run lint`: Run ESLint
- `npm run clean`: Clean build directory

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
