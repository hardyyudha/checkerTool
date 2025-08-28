const TARGET_TAGS = ["h1","h2","h3","h4","h5","h6","p"];
const corsProxies = [
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors.bridged.cc/',
  'https://api.codetabs.com/v1/proxy?quest='
];

// Utility to fetch via CORS proxy
async function fetchWithCors(url) {
  for (let proxy of corsProxies) {
    try {
      const proxiedUrl = proxy + encodeURIComponent(url);
      const res = await fetch(proxiedUrl);
      if (!res.ok) continue;
      if (proxy.includes("allorigins")) {
        const data = await res.json();
        return data.contents;
      }
      return await res.text();
    } catch(e) { continue; }
  }
  throw new Error("All CORS proxies failed.");
}

// -------------------- SCRAPER --------------------
async function scrapePages(baseUrl) {
  const html = await fetchWithCors(baseUrl);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = Array.from(doc.querySelectorAll("a")).map(a => a.getAttribute("href")).filter(Boolean);

  const filtered = [];
  const seen = new Set();
  const baseOrigin = new URL(baseUrl).origin;
  const excludeExt = [".webp", ".jpg", ".png", ".pdf", ".zip", ".docx", ".jpeg"];

  for (let href of links) {
    let url;
    try { url = new URL(href, baseUrl).href; } catch { continue; }
    if (!url.startsWith(baseOrigin)) continue;
    if (excludeExt.some(ext => url.toLowerCase().endsWith(ext))) continue;
    if (url.includes("#")) continue;
    if (!seen.has(url)) {
      seen.add(url);
      try { await fetchWithCors(url); filtered.push(url); } catch {}
    }
  }
  return filtered;
}

async function scrapePagesHandler() {
  const baseUrl = document.getElementById("scrapeUrlInput").value.trim();
  const resultsDiv = document.getElementById("scrapeResults");
  resultsDiv.innerHTML = "🔍 Scraping pages...";
  if (!baseUrl) { resultsDiv.textContent = "⚠️ Please enter a base URL."; return; }

  try {
    const pages = await scrapePages(baseUrl);
    if (!pages.length) resultsDiv.textContent = "⛔ No valid pages found.";
    else {
      resultsDiv.innerHTML = "<h3 class='section-header'>Scraped Pages:</h3>";
      pages.forEach(url => {
        const div = document.createElement("div");
        div.className = "page";
        div.textContent = url;
        resultsDiv.appendChild(div);
      });
    }
  } catch(err) {
    resultsDiv.textContent = "⚠️ Error scraping base URL: " + err.message;
  }
}

// -------------------- DUPLICATE CHECK --------------------
async function scrapeElements(url) {
  const html = await fetchWithCors(url);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const main = doc.querySelector("main") || doc.body;
  if (!main) return [];

  main.querySelectorAll("header, footer, form, nav, script, style").forEach(el => el.remove());

  const elements = [];
  TARGET_TAGS.forEach(tag => {
    main.querySelectorAll(tag).forEach(el => {
      const text = el.textContent.trim();
      if (text) elements.push({ tag, text });
    });
  });
  return elements;
}

function detectDuplicates(elements) {
  const seen = new Map();
  const duplicates = [];
  elements.forEach(({ tag, text }, idx) => {
    const key = `${tag}::${text}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(idx + 1);
  });
  seen.forEach((positions, key) => {
    if (positions.length > 1) {
      const [tag, text] = key.split("::");
      duplicates.push({ tag, text, positions });
    }
  });
  return duplicates;
}

async function duplicateCheckHandler() {
  const url = document.getElementById("duplicateUrlInput").value.trim();
  const resultsDiv = document.getElementById("duplicateResults");
  resultsDiv.innerHTML = "🔍 Checking duplicates...";
  if (!url) { resultsDiv.textContent = "⚠️ Please enter a page URL."; return; }

  try {
    const elements = await scrapeElements(url);
    if (!elements.length) { resultsDiv.textContent = "⛔ No content found."; return; }

    const duplicates = detectDuplicates(elements);
    if (!duplicates.length) resultsDiv.textContent = "✅ No duplicates found.";
    else {
      resultsDiv.innerHTML = "<h3 class='section-header'>Duplicates Found:</h3>";
      duplicates.forEach(d => {
        const div = document.createElement("div");
        div.className = "duplicate";
        div.innerHTML = `<strong>${d.tag.toUpperCase()}</strong>: ${d.text}<br>
                         <small>Positions: ${d.positions.join(", ")}</small>`;
        resultsDiv.appendChild(div);
      });
    }
  } catch(err) {
    resultsDiv.textContent = "⚠️ Error: " + err.message;
  }
}

// -------------------- TYPO CHECKER --------------------

// Extract visible text
function extractText(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const main = doc.querySelector("main") || doc.body;
  if (!main) return "";

  main.querySelectorAll("script, style, header, footer, nav, form").forEach(el => el.remove());

  // Join each block of text with a newline
  return Array.from(main.querySelectorAll("h1,h2,h3,h4,h5,h6,p"))
              .map(el => el.textContent.trim())
              .filter(t => t.length > 0)
              .join("\n");
}

// Split text into chunks (~2000 chars)
function splitChunks(text, size = 2000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// Send chunk to LanguageTool
async function checkChunk(text, language="en-US") {
  const apiRes = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ text, language })
  });
  return apiRes.json();
}

// Main function
async function checkTyposFull() {
  const url = document.getElementById("typoCheckerInput").value.trim();
  const resultsDiv = document.getElementById("typoResults");
  resultsDiv.innerHTML = "🔍 Checking typos...";
  if (!url) { resultsDiv.textContent = "⚠️ Please enter a URL."; return; }

  try {
    const html = await fetchWithCors(url);
    const text = extractText(html);
    if (!text) { resultsDiv.textContent = "⛔ No text found on page."; return; }

    const chunks = splitChunks(text);
    let allTypos = [];

    for (let i = 0; i < chunks.length; i++) {
      const data = await checkChunk(chunks[i]);
      allTypos = allTypos.concat(data.matches);
    }

    if (!allTypos.length) {
      resultsDiv.textContent = "✅ No typos found.";
      return;
    }

    resultsDiv.innerHTML = "<h3>⚠️ Possible Typos / Suggestions:</h3>";
    // Create table
    let tableHTML = "<table><tr><th>Word</th><th>Suggestion</th></tr>";
    allTypos.forEach(m => {
      const word = m.context.text.substr(m.context.offset, m.context.length);
      const suggestions = m.replacements.map(r => r.value).join(", ");
      tableHTML += `<tr><td>${word}</td><td>${suggestions}</td></tr>`;
    });
    tableHTML += "</table>";
    resultsDiv.innerHTML = tableHTML;

  } catch(err) {
    resultsDiv.textContent = "⚠️ Error: " + err.message;
  }
}