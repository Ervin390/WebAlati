---
name: seo-max
description: Comprehensive SEO optimization skill for web pages and blog posts. Use this skill whenever the user asks to improve, audit, or maximise SEO for any page, file, or the whole site.
---

# SEO Max Skill

You are an expert SEO engineer. When this skill is active, apply every applicable rule below to any HTML, JS, or content file you create or modify.

---

## 1. Meta & Head Tags

Every HTML page **must** have:

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Primary Keyword] – [Brand Name]</title>
<meta name="description" content="[150–160 char summary with primary keyword]">
<meta name="robots" content="index, follow">
<link rel="canonical" href="[absolute URL of this page]">
```

### Open Graph (social sharing)
```html
<meta property="og:type" content="website">
<meta property="og:title" content="[Title]">
<meta property="og:description" content="[Description]">
<meta property="og:url" content="[Canonical URL]">
<meta property="og:image" content="[Absolute image URL, ≥1200×630px]">
<meta property="og:locale" content="[e.g. hr_HR or en_US]">
```

### Twitter Card
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Title]">
<meta name="twitter:description" content="[Description]">
<meta name="twitter:image" content="[Image URL]">
```

---

## 2. Structured Data (JSON-LD)

Add the appropriate `<script type="application/ld+json">` block in `<head>`:

- **Homepage / tool directory** → `WebSite` + `SearchAction`
- **Blog post** → `Article` (with `datePublished`, `dateModified`, `author`, `image`)
- **Tool listing page** → `ItemList`

Minimum `WebSite` schema:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "[Site name]",
  "url": "[https://domain.com]",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "[https://domain.com/search?q={search_term_string}]",
    "query-input": "required name=search_term_string"
  }
}
```

---

## 3. Heading Hierarchy

- **One `<h1>` per page** — must contain the primary keyword.
- Subheadings: `<h2>` for main sections, `<h3>` for subsections.
- Never skip levels (e.g. h1 → h3).

---

## 4. Images

Every `<img>` must have:
```html
<img src="..." alt="[descriptive keyword-rich alt text]" width="W" height="H" loading="lazy">
```
- Use `loading="eager"` only for the hero/above-the-fold image.
- Filename should be descriptive: `ai-writing-tool-review.webp`, not `img1.jpg`.
- Prefer **WebP** format for all images.

---

## 5. URL Structure

- Use lowercase, hyphen-separated slugs: `/hr/blogovi/ai-alati-za-pisanje`
- No query strings for navigable pages.
- Language prefix as a directory: `/hr/`, `/en/`.
- Include `<link rel="alternate" hreflang="hr" href="[HR URL]">` and `<link rel="alternate" hreflang="en" href="[EN URL]">` on every page.

---

## 6. Performance (Core Web Vitals)

- Inline **critical CSS** in `<style>` in the `<head>`; load the rest with `<link rel="stylesheet">`.
- Defer non-critical JS: `<script src="..." defer></script>`.
- Preconnect to external origins used above the fold:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ```
- Set explicit `width` and `height` on all `<img>` to prevent Layout Shift (CLS).

---

## 7. Internal Linking

- Every page should link to at least 2–3 other relevant internal pages using keyword-rich anchor text.
- Avoid generic anchor text like "click here" or "read more".

---

## 8. robots.txt & sitemap.xml

When auditing or building the site, ensure:

**`robots.txt`** (site root):
```
User-agent: *
Allow: /
Sitemap: https://[domain]/sitemap.xml
```

**`sitemap.xml`** (site root): list all crawlable pages with `<lastmod>`, `<changefreq>`, and `<priority>`.

---

## 9. Blog / Article Content Rules

- Target **one primary keyword** per post; use it in: title, first 100 words, one `<h2>`, meta description, and image alt.
- Use **LSI / semantic keywords** naturally throughout the body.
- Aim for **≥600 words** for informational posts.
- Add a **Table of Contents** (`<nav>` with anchor links) for posts over 800 words.
- Include an **FAQ section** with `FAQPage` schema for posts targeting question-based queries.

---

## 10. Multilingual (hreflang)

For every language variant, add in `<head>`:
```html
<link rel="alternate" hreflang="hr" href="https://webalati.tech/hr/">
<link rel="alternate" hreflang="en" href="https://webalati.tech/en/">
<link rel="alternate" hreflang="x-default" href="https://webalati.tech/en/">
```

---

## Audit Checklist

When asked to **audit** a page, check every item below and report pass/fail with a fix:

| # | Check | Pass? |
|---|-------|-------|
| 1 | `<title>` present, 50–60 chars, contains keyword | |
| 2 | `<meta description>` present, 150–160 chars | |
| 3 | `<link rel="canonical">` present | |
| 4 | Exactly one `<h1>` | |
| 5 | All images have descriptive `alt` text | |
| 6 | All images have `width` + `height` attributes | |
| 7 | Open Graph tags complete | |
| 8 | JSON-LD structured data present and valid | |
| 9 | hreflang tags for all language variants | |
| 10 | `robots.txt` allows crawling | |
| 11 | `sitemap.xml` exists and is referenced in robots.txt | |
| 12 | No render-blocking scripts (use `defer`/`async`) | |
| 13 | Internal links use keyword-rich anchor text | |
| 14 | Page loads in <3 s (check with Lighthouse) | |
