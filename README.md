# Ansilian

Ansilian is a community-driven archive for **Sound Space**.

The original goal was simply to have one place where I could preserve things that would otherwise disappear into Discord messages, old Google Drives, random GitHub repositories, or YouTube videos.

Over time it slowly became... whatever this is now.

---

## Why this README exists

This project has grown a lot.

Originally it was just a few HTML pages.

Now it has reusable components, shared JavaScript, JSON-driven content, reusable CSS, and enough moving parts that **future me is absolutely going to forget how something works**.

This README is mostly documentation for myself.

If you're reading this because you somehow found the repository, hopefully it also helps you.

---

# Project Structure

```text
.
├── assets/             Images and static assets
├── components/         Shared HTML components
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── typography.css
│   ├── components.css
│   └── pages/
├── js/
│   ├── components.js
│   ├── nav.js
│   ├── search.js
│   ├── articles.js
│   └── utils.js
├── articles/
├── archivers/
└── ss-hub/
```

The general rule is simple:

* Shared things go into `css/`, `js/`, or `components/`.
* Page-specific things stay with that page.
* Content should live in JSON whenever possible.

---


# Universal Search

The topbar Search button opens `/search/`, the universal search page.

The page loads the JSON indexes for articles, customs, skins, SSPM maps, and archivers. Each category has its own collapsible filter section, with the same three-state include/exclude filter behavior used by the archive pages. Results are sorted newest-first by their content date.

Universal search cards preserve the important actions from their source pages, including opening article readers, downloading maps and assets, copying skin/cursor data, opening media previews, and opening archiver profiles.

When adding a new JSON-driven content section, add a dataset definition to `js/universal-search.js` with its source, searchable fields, filter groups, date/id sorting, and renderer.

# How I add a new article

1. Write the article in Obsidian.
2. Copy it into the website.
3. Add the metadata to `articles/posts/posts.json`.
4. Add the thumbnail if needed.
5. Test that everything renders correctly.
6. Commit and push.

The website builds the article list from the JSON, so there is no need to manually edit the index page.

---

# How I add a skin

1. Add the downloadable files.
2. Add the preview image.
3. Update the skins JSON.
4. Refresh the page and make sure it appears.

---

# How I add other content

Settings, customs, archivers, and similar sections all follow the same idea:

* put the content in the correct folder;
* update the corresponding JSON file;
* verify that the page renders correctly.

Whenever possible, avoid hardcoding content directly into HTML.

---

# CSS

The CSS is split into shared files and page-specific files.

Shared styles belong in:

* `base.css`
* `layout.css`
* `typography.css`
* `components.css`

Anything that only one page uses should live under `css/pages/`.

If you find yourself copying CSS between pages, it probably belongs in one of the shared files instead.

---

# JavaScript

The JavaScript follows the same idea.

* `utils.js` contains shared helper functions.
* `search.js` contains reusable search logic.
* `articles.js` handles article listings.
* `components.js` loads reusable HTML components.
* `nav.js` handles navigation behaviour.

If a function is useful in more than one place, move it into a shared module instead of copying it.

---

# Components

Reusable HTML lives in the `components/` folder.

Pages include them using:

```html
<div data-component="navbar"></div>
```

which is loaded by `components.js`.

If multiple pages need the same HTML, it should become a component instead of being copied.

---

# Development Philosophy

I'm intentionally keeping this project simple.

It's just a static website.

No backend.

No database.

No build step.

No frameworks.

If plain HTML, CSS, JavaScript, and JSON can solve the problem, that's probably the solution I want.

---

# If you're future me...

Hi.

You probably opened this repository after not touching it for six months.

Don't panic.

Everything is much simpler than it looks.

Most content is JSON-driven.

Most shared code lives in `css/`, `js/`, or `components/`.

Start there.

Good luck.
