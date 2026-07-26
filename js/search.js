(() => {
    const { normalize, uniqueSorted } = window.AnsilianUtils || {};

    function createToggleStateMap() {
        return new Map();
    }

    function cycleThreeState(map, key) {
        const current = map.get(key) || "neutral";
        const next =
            current === "neutral"
                ? "include"
                : current === "include"
                  ? "exclude"
                  : "neutral";
        if (next === "neutral") map.delete(key);
        else map.set(key, next);
        return next;
    }

    function selectedKeys(map, state) {
        return [...map.entries()]
            .filter(([, value]) => value === state)
            .map(([key]) => key);
    }

    function collectUnique(items, getter) {
        return uniqueSorted(
            items.flatMap((item) => {
                const values = getter(item);
                return Array.isArray(values) ? values : [values];
            }),
        );
    }

    function matchesTextQuery(query, values) {
        const normalizedQuery = normalize(query);
        if (!normalizedQuery) return true;

        const haystack = values
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean)
            .map(normalize)
            .join(" ");

        return normalizedQuery
            .split(/\s+/)
            .filter(Boolean)
            .every((term) => haystack.includes(term));
    }

    window.AnsilianSearch = {
        createToggleStateMap,
        cycleThreeState,
        selectedKeys,
        collectUnique,
        matchesTextQuery,
    };
})();

(() => {
    const { escapeHtml, renderTags } = window.AnsilianUtils;

    // The same normalized source model is used by the universal search page
    // and the global search overlay, so every searchable item behaves the same.
    const SOURCES = [
        {
            category: "ss-hub-articles",
            typeLabel: "Article",
            url: "/ss-hub/articles/posts/posts.json",
            map: (item) => ({
                title: item.title,
                description: item.description,
                author: item.author,
                date: item.date,
                tags: item.tags || [],
                href: `/ss-hub/articles/reader.html?post=${encodeURIComponent(item.id)}`,
                searchable: [item.title, item.description, item.author, ...(item.tags || [])],
            }),
        },
        {
            category: "archivers",
            typeLabel: "Archiver",
            url: "/archivers/archivers.json",
            map: (item) => ({
                title: item.name,
                description: item.role,
                author: item.name,
                date: item.since,
                tags: [item.role].filter(Boolean),
                href: "/archivers/",
                searchable: [item.name, item.role, item.since],
            }),
        },
        {
            category: "customs",
            typeLabel: "Custom",
            url: "/ss-hub/customs/customs.json",
            map: (item) => {
                const tags = Array.isArray(item.pattern)
                    ? item.pattern
                    : item.pattern
                      ? [item.pattern]
                      : [];
                return {
                    title: item.name,
                    description: `Mapped by ${item.mapper || "unknown mapper"}`,
                    author: item.mapper,
                    date: item.date,
                    tags,
                    href: `/ss-hub/customs/?q=${encodeURIComponent(item.name)}`,
                    searchable: [
                        item.name,
                        item.mapper,
                        item.archiver,
                        item.id,
                        item.rating,
                        ...tags,
                    ],
                };
            },
        },
        {
            category: "skins",
            typeLabel: "Skin",
            url: "/ss-hub/skins/assets/index.json",
            map: (item) => ({
                title: item.title,
                description: item.type,
                author: item.author,
                date: item.date,
                tags: [item.type, ...(item.tags || [])].filter(Boolean),
                href: `/ss-hub/skins/?q=${encodeURIComponent(item.title)}`,
                searchable: [item.title, item.author, item.type, ...(item.tags || [])],
            }),
        },
        {
            category: "settings",
            typeLabel: "Settings",
            url: "/ss-hub/settings/configs/index.json",
            map: (item) => ({
                title: item.title || `Config #${item.id}`,
                description: item.format,
                author: item.author,
                date: item.date,
                tags: [item.format, ...(item.tags || [])].filter(Boolean),
                href: `/ss-hub/settings/?q=${encodeURIComponent(item.title || item.id)}`,
                searchable: [item.title, item.author, item.format, ...(item.tags || [])],
            }),
        },
        {
            category: "sspm",
            typeLabel: "SSPM Map",
            url: "/ss-hub/sspm-archive/sspm.json",
            map: (item) => {
                const tags = Array.isArray(item.pattern)
                    ? item.pattern
                    : item.pattern
                      ? [item.pattern]
                      : [];
                return {
                    title: item.name,
                    description: `Mapped by ${item.mapper || "unknown mapper"}`,
                    author: item.mapper,
                    date: item.date,
                    tags,
                    href: `/ss-hub/sspm-archive/?q=${encodeURIComponent(item.name)}`,
                    searchable: [
                        item.name,
                        item.mapper,
                        item.archiver,
                        item.id,
                        item.rating,
                        ...tags,
                    ],
                };
            },
        },
    ];

    const page = {
        items: [],
        loading: false,
    };

    function getElements() {
        return {
            input: document.getElementById("universal-search-input"),
            clear: document.getElementById("clear-search-btn"),
            category: document.getElementById("category-select"),
            author: document.getElementById("author-select"),
            tag: document.getElementById("tag-select"),
            results: document.getElementById("search-results-grid"),
            title: document.getElementById("results-title"),
            count: document.getElementById("results-count"),
            subFilters: document.querySelectorAll(".sub-filter"),
        };
    }

    async function loadSource(source) {
        try {
            const response = await fetch(source.url);
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            const data = await response.json();
            return data
                .map((item) => ({
                    ...source.map(item),
                    category: source.category,
                    typeLabel: source.typeLabel,
                }))
                .filter((item) => item.title);
        } catch (error) {
            console.error(`Search: failed to load ${source.url}`, error);
            return [];
        }
    }

    async function loadAllData() {
        if (page.loading) return;
        page.loading = true;

        const { results } = getElements();
        if (results) results.innerHTML = '<p class="status-text">loading...</p>';

        const groups = await Promise.all(SOURCES.map(loadSource));
        page.items = groups.flat();
        page.loading = false;

        populateFilters();
        renderResults();
    }

    function populateFilters() {
        const { author, tag } = getElements();
        if (!author || !tag) return;

        const authors = [...new Set(page.items.map((item) => item.author).filter(Boolean))].sort();
        const tags = [...new Set(page.items.flatMap((item) => item.tags || []).filter(Boolean))].sort();

        author.innerHTML = '<option value="all">All Authors</option>' +
            authors.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");

        tag.innerHTML = '<option value="all">All Tags</option>' +
            tags.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    }

    function updateSubfilterVisibility(category) {
        const { subFilters } = getElements();
        subFilters.forEach((filter) => {
            const categories = (filter.dataset.category || "").split(/\s+/);
            filter.hidden = category !== "all" && !categories.includes(category);
        });
    }

    function filterItems() {
        const { input, category, author, tag } = getElements();
        const query = input?.value || "";
        const selectedCategory = category?.value || "all";
        const selectedAuthor = author?.value || "all";
        const selectedTag = tag?.value || "all";

        return page.items
            .filter((item) => {
                const textMatches = window.AnsilianSearch.matchesTextQuery(
                    query,
                    item.searchable || [],
                );
                const categoryMatches =
                    selectedCategory === "all" || item.category === selectedCategory;
                const authorMatches =
                    selectedAuthor === "all" || item.author === selectedAuthor;
                const tagMatches =
                    selectedTag === "all" || (item.tags || []).includes(selectedTag);

                return textMatches && categoryMatches && authorMatches && tagMatches;
            })
            .sort((a, b) => {
                const dateA = Date.parse(a.date || "") || 0;
                const dateB = Date.parse(b.date || "") || 0;
                return dateB - dateA || a.title.localeCompare(b.title);
            });
    }

    function renderCard(item) {
        const tags = (item.tags || []).slice(0, 6);
        return `
            <article class="search-card" data-category="${escapeHtml(item.category)}">
                <div class="card-meta">
                    <span class="badge">${escapeHtml(item.typeLabel)}</span>
                    ${item.date ? `<time datetime="${escapeHtml(item.date)}">${escapeHtml(item.date)}</time>` : ""}
                </div>
                <h3><a href="${escapeHtml(item.href)}">${escapeHtml(item.title)}</a></h3>
                ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
                <div class="card-footer">
                    ${item.author ? `<span class="author">By ${escapeHtml(item.author)}</span>` : "<span></span>"}
                    ${tags.length ? `<div class="card-tags">${renderTags(tags)}</div>` : ""}
                </div>
            </article>
        `;
    }

    function renderResults() {
        const { input, category, author, tag, results, title, count } = getElements();
        if (!results) return;

        const query = input?.value.trim() || "";
        const selectedCategory = category?.value || "all";
        const selectedAuthor = author?.value || "all";
        const selectedTag = tag?.value || "all";
        const filtered = filterItems();
        const defaultView = !query &&
            selectedCategory === "all" &&
            selectedAuthor === "all" &&
            selectedTag === "all";
        const visible = defaultView ? filtered.slice(0, 12) : filtered;

        if (title) title.textContent = defaultView ? "Latest Added Items" : "Search Results";
        if (count) count.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"} found`;

        results.innerHTML = visible.length
            ? visible.map(renderCard).join("")
            : '<p class="no-results">No items matched your search criteria.</p>';
    }

    function initializeUniversalSearch() {
        const { input, clear, category, author, tag } = getElements();
        if (!input) return;

        input.addEventListener("input", () => {
            if (clear) clear.hidden = !input.value;
            renderResults();
        });

        clear?.addEventListener("click", () => {
            input.value = "";
            clear.hidden = true;
            renderResults();
            input.focus();
        });

        category?.addEventListener("change", () => {
            updateSubfilterVisibility(category.value);
            if (author) author.value = "all";
            if (tag) tag.value = "all";
            renderResults();
        });

        author?.addEventListener("change", renderResults);
        tag?.addEventListener("change", renderResults);

        updateSubfilterVisibility(category?.value || "all");
        loadAllData();
    }

    document.addEventListener("DOMContentLoaded", initializeUniversalSearch);
})();
