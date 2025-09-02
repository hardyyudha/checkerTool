# Page Scraper & Duplicate Checker

A web application that provides three main functionalities:
1. **Page Scraper** - Scrapes pages from a base URL
2. **Typo Checker** - Checks multiple URLs for typos using LanguageTool API
3. **Duplicate Checker** - Checks multiple URLs for duplicate content

## Features

### Multiple URL Support
- **Typo Checker**: Enter multiple URLs (one per line) to check for typos across multiple pages
- **Duplicate Checker**: Enter multiple URLs (one per line) to check for duplicate content across multiple pages
- Progress indicators show which URL is currently being processed
- Results are clearly separated and organized by URL

### Page Scraper
- Scrapes all accessible pages from a base URL
- Filters out non-HTML files (images, PDFs, etc.)
- Shows list of discovered pages

### Typo Checker
- Uses LanguageTool API for professional-grade spell checking
- Processes text in chunks for better performance
- Shows typos with suggested corrections in a table format
- Handles multiple URLs sequentially

### Duplicate Checker
- Analyzes HTML content for duplicate text elements
- Focuses on headings (h1-h6) and paragraphs (p)
- Shows duplicate content with positions
- Handles multiple URLs sequentially

## Usage

1. **Page Scraper**:
   - Enter a base URL in the input field
   - Click "Scrape Pages" to discover all accessible pages

2. **Typo Checker**:
   - Enter URLs in the textarea (one per line)
   - Click "Check Typos" to analyze all URLs for spelling errors
   - Results show typos with suggestions for each URL

3. **Duplicate Checker**:
   - Enter URLs in the textarea (one per line)
   - Click "Check Duplicates" to find duplicate content
   - Results show duplicates with positions for each URL

## File Structure

- `index.html` - Main HTML structure
- `style.css` - Styling and layout
- `main.js` - JavaScript functionality
- `README.md` - This documentation

## Technical Details

- Uses CORS proxies to handle cross-origin requests
- Processes URLs sequentially to avoid overwhelming servers
- Progress indicators show current processing status
- Error handling for failed requests
- Responsive design with modern CSS

## Example Input

For Typo Checker or Duplicate Checker, you can input multiple URLs like this:
```
https://example.com/page1
https://example.com/page2
https://example.com/page3
```

Each URL will be processed individually and results will be clearly separated.
