(() => {
    const { escapeHtml, renderTags } = window.AnsilianUtils;

    // Every JSON source on the site, normalized into a single flat list of
    // searchable items. Add a new source here whenever a new content type
    // is added to the project.
    const SOURCES = [
        {
            type: "article",
            typeLabel: "Article",
            url: "/ss-hub/articles/posts/posts.json",
            map: (post) => ({
                title: post.title,
                subtitle: post.author ? `by ${post.author}` : "",
                date: post.date || "",
                tags: post.tags || [],
                href: `/ss-hub/articles/reader.html?post=${encodeURIComponent(post.id)}`,
                searchable: [post.title, post.author, ...(post.tags || [])],
            }),
        },
        {
            type: "custom",
            typeLabel: "Custom Map",
            url: "/ss-hub/customs/customs.json",
            map: (custom) => {
                const patterns = Array.isArray(custom.pattern)
                    ? custom.pattern
                    : custom.pattern
                      ? [custom.pattern]
                      : [];
                return {
                    title: custom.name,
                    subtitle: custom.mapper ? `mapped by ${custom.mapper}` : "",
                    date: custom.date || "",
                    tags: patterns,
                    href: `/ss-hub/customs/?q=${encodeURIComponent(custom.name)}`,
                    searchable: [
                        custom.name,
                        custom.mapper,
                        custom.archiver,
                        custom.id,
                        custom.rating,
                        ...patterns,
                    ],
                };
            },
        },
        {
            type: "skin",
            typeLabel: "Skin",
            url: "/ss-hub/skins/assets/index.json",
            map: (skin) => ({
                title: skin.title,
                subtitle: [skin.author && `by ${skin.author}`, skin.type]
                    .filter(Boolean)
                    .join(" · "),
                date: skin.date || "",
                tags: [skin.type, ...(skin.tags || [])].filter(Boolean),
                href: `/ss-hub/skins/?q=${encodeURIComponent(skin.title)}`,
                searchable: [skin.title, skin.author, skin.type, ...(skin.tags || [])],
            }),
        },
        {
            type: "setting",
            typeLabel: "Settings",
            url: "/ss-hub/settings/configs/index.json",
            map: (config) => ({
                title: config.title || `Config #${config.id}`,
                subtitle: [config.author && `by ${config.author}`, config.format]
                    .filter(Boolean)
                    .join(" · "),
                date: config.date || "",
                tags: [config.format, ...(config.tags || [])].filter(Boolean),
                href: `/ss-hub/settings/?q=${encodeURIComponent(config.title || config.id)}`,
                searchable: [config.title, config.author, config.format, ...(config.tags || [])],
            }),
        },
        {
            type: "sspm",
            typeLabel: "SSPM Map",
            url: "/ss-hub/sspm-archive/sspm.json",
            map: (map) => {
                const patterns = Array.isArray(map.pattern)
                    ? map.pattern
                    : map.pattern
                      ? [map.pattern]
                      : [];
                return {
                    title: map.name,
                    subtitle: map.mapper ? `mapped by ${map.mapper}` : "",
                    date: map.date || "",
                    tags: patterns,
                    href: `/ss-hub/sspm-archive/?q=${encodeURIComponent(map.name)}`,
                    searchable: [
                        map.name,
                        map.mapper,
                        map.archiver,
                        map.id,
                        map.rating,
                        ...patterns,
                    ],
                };
            },
        },
        {
            type: "archiver",
            typeLabel: "Archiver",
            url: "/archivers/archivers.json",
            map: (person) => ({
                title: person.name,
                subtitle: person.role || "",
                date: person.since || "",
                tags: [person.role].filter(Boolean),
                href: "/archivers",
                searchable: [person.name, person.role],
            }),
        },
    ];

    const state = {
        items: null,
        loadingPromise: null,
        typeStates: null,
        tagStates: null,
        sectionOpen: { type: true, tags: true },
    };

    function els() {
        return {
            trigger: document.getElementById("global-search-trigger"),
            overlay: document.getElementById("global-search-overlay"),
            input: document.getElementById("global-search-input"),
            close: document.getElementById("global-search-close"),
            results: document.getElementById("global-search-results"),
            typeList: document.getElementById("list-global-type"),
            tagList: document.getElementById("list-global-tags"),
        };
    }

    async function fetchSource(source) {
        try {
            const response = await fetch(source.url);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((raw) => ({
                type: source.type,
                typeLabel: source.typeLabel,
                ...source.map(raw),
            }));
        } catch (error) {
            console.error(`Global search: failed to load ${source.url}`, error);
            return [];
        }
    }

    async function loadIndex() {
        if (state.items) return state.items;
        if (!state.loadingPromise) {
            state.loadingPromise = Promise.all(SOURCES.map(fetchSource)).then(
                (groups) => {
                    state.items = groups.flat().filter((item) => item.title);
                    const { createToggleStateMap } = window.AnsilianSearch;
                    state.typeStates = createToggleStateMap();
                    state.tagStates = createToggleStateMap();
                    return state.items;
                },
            );
        }
        return state.loadingPromise;
    }

    function toggleSection(key) {
        state.sectionOpen[key] = !state.sectionOpen[key];
        const list = document.getElementById(`list-global-${key}`);
        const arrow = document.getElementById(`arrow-global-${key}`);
        if (list) list.style.display = state.sectionOpen[key] ? "flex" : "none";
        if (arrow) arrow.classList.toggle("closed", !state.sectionOpen[key]);
        document
            .querySelector(`[data-toggle-section="global-${key}"]`)
            ?.setAttribute("aria-expanded", String(state.sectionOpen[key]));
    }

    function buildFilterButton(label, map) {
        const { cycleThreeState } = window.AnsilianSearch;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-item toggle-item state-neutral";
        button.textContent = label;
        button.addEventListener("click", () => {
            const next = cycleThreeState(map, label);
            button.className = `filter-item toggle-item state-${next}`;
            renderResults();
        });
        return button;
    }

    function buildFilters() {
        const { collectUnique } = window.AnsilianSearch;
        const { typeList, tagList } = els();

        const types = collectUnique(state.items, (item) => [item.typeLabel]);
        if (typeList) {
            typeList.innerHTML = "";
            types.forEach((label) => typeList.appendChild(buildFilterButton(label, state.typeStates)));
        }

        const tags = collectUnique(state.items, (item) => item.tags || []);
        if (tagList) {
            tagList.innerHTML = "";
            tags.forEach((tag) => tagList.appendChild(buildFilterButton(tag, state.tagStates)));
        }
    }

    function filterItems() {
        const { matchesTextQuery, selectedKeys } = window.AnsilianSearch;
        const { input } = els();
        const query = input?.value || "";

        const includedTypes = selectedKeys(state.typeStates, "include");
        const excludedTypes = selectedKeys(state.typeStates, "exclude");
        const includedTags = selectedKeys(state.tagStates, "include");
        const excludedTags = selectedKeys(state.tagStates, "exclude");

        return state.items.filter((item) => {
            const itemTags = item.tags || [];
            const matchesSearch = matchesTextQuery(query, item.searchable || []);
            const typeOk =
                !excludedTypes.includes(item.typeLabel) &&
                (includedTypes.length === 0 || includedTypes.includes(item.typeLabel));
            const tagsOk =
                !itemTags.some((tag) => excludedTags.includes(tag)) &&
                (includedTags.length === 0 ||
                    includedTags.every((tag) => itemTags.includes(tag)));
            return matchesSearch && typeOk && tagsOk;
        });
    }

    function renderResultCard(item) {
        const tagsHtml = item.tags && item.tags.length ? renderTags(item.tags) : "";
        return `
            <a class="search-result-card" href="${escapeHtml(item.href)}">
                <div class="search-result-top">
                    <span class="search-result-type">${escapeHtml(item.typeLabel)}</span>
                    ${item.date ? `<span class="search-result-date">${escapeHtml(item.date)}</span>` : ""}
                </div>
                <div class="search-result-title">${escapeHtml(item.title)}</div>
                ${item.subtitle ? `<div class="search-result-meta">${escapeHtml(item.subtitle)}</div>` : ""}
                ${tagsHtml ? `<div class="card-tags" style="margin-top:8px;">${tagsHtml}</div>` : ""}
            </a>
        `;
    }

    function renderResults() {
        const { results } = els();
        if (!results || !state.items) return;

        const matches = filterItems().sort((a, b) => (b.date || "").localeCompare(a.date || ""));

        if (matches.length === 0) {
            results.innerHTML = '<p class="search-status-text">no results found.</p>';
            return;
        }

        results.innerHTML = matches.map(renderResultCard).join("");
    }

    async function openOverlay() {
        const { overlay, input } = els();
        if (!overlay) return;
        overlay.classList.add("open");
        document.body.style.overflow = "hidden";

        if (!state.items) {
            const results = els().results;
            if (results) results.innerHTML = '<p class="search-status-text">loading...</p>';
            await loadIndex();
            buildFilters();
        }

        renderResults();
        input?.focus();
    }

    function closeOverlay() {
        const { overlay, trigger } = els();
        if (!overlay) return;
        overlay.classList.remove("open");
        document.body.style.overflow = "";
        trigger?.focus();
    }

    function wireEvents() {
        const { trigger, overlay, input, close } = els();
        if (!trigger || !overlay) return;

        trigger.addEventListener("click", openOverlay);
        close?.addEventListener("click", closeOverlay);
        input?.addEventListener("input", renderResults);

        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeOverlay();
        });

        document.addEventListener("keydown", (event) => {
            const isOpen = overlay.classList.contains("open");
            if (event.key === "Escape" && isOpen) {
                closeOverlay();
                return;
            }
            const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
            if (isShortcut) {
                event.preventDefault();
                openOverlay();
            }
        });
    }

    window.AnsilianGlobalSearch = { toggleSection, openOverlay, closeOverlay };

    document.addEventListener("components:loaded", wireEvents);
})();
