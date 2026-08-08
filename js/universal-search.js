js
(() => {
    const {
        escapeHtml,
        getYouTubeData,
        renderTags,
    } = window.AnsilianUtils;

    const { matchesTextQuery } = window.AnsilianSearch;

    const state = {
        query: "",
        datasets: [],
        filters: new Map(),
        enabledDatasets: new Map(),
    };

    const DATASETS = [
        {
            key: "articles",
            label: "Articles",
            page: "/articles/",
            source: "/articles/posts/posts.json",
            filterGroups: [
                {
                    key: "author",
                    label: "authors",
                    values: (item) => [item.author],
                },
                {
                    key: "tags",
                    label: "tags",
                    values: (item) => item.tags || [],
                },
            ],
            searchable: (item) => [
                item.title,
                item.author,
                item.description,
                ...(item.tags || []),
            ],
            date: (item) => item.date,
            id: (item) => Number(item.id) || 0,
            render: renderArticle,
        },

        {
            key: "ssArticles",
            label: "SS Hub Articles",
            page: "/ss-hub/articles/",
            source: "/ss-hub/articles/posts/posts.json",
            filterGroups: [
                {
                    key: "author",
                    label: "authors",
                    values: (item) => [item.author],
                },
                {
                    key: "tags",
                    label: "tags",
                    values: (item) => item.tags || [],
                },
            ],
            searchable: (item) => [
                item.title,
                item.author,
                item.description,
                ...(item.tags || []),
            ],
            date: (item) => item.date,
            id: (item) => Number(item.id) || 0,
            render: renderSSArticle,
        },

        {
            key: "customs",
            label: "Customs",
            page: "/ss-hub/customs/",
            source: "/ss-hub/customs/customs.json",
            filterGroups: [
                {
                    key: "pattern",
                    label: "patterns",
                    values: (item) =>
                        Array.isArray(item.pattern)
                            ? item.pattern
                            : item.pattern
                              ? [item.pattern]
                              : [],
                },
                {
                    key: "rating",
                    label: "ratings",
                    values: (item) => [item.rating],
                },
                {
                    key: "mapper",
                    label: "mappers",
                    values: (item) => [item.mapper],
                },
                {
                    key: "archiver",
                    label: "archivers",
                    values: (item) => [item.archiver],
                },
            ],
            searchable: (item) => [
                item.name,
                item.mapper,
                item.archiver,
                item.rating,
                item.id,
                ...(Array.isArray(item.pattern)
                    ? item.pattern
                    : [item.pattern]),
            ],
            date: (item) => item.date,
            id: (item) => Number(item.id) || 0,
            render: renderMap,
        },

        {
            key: "skins",
            label: "Skins",
            page: "/ss-hub/skins/",
            source: "/ss-hub/skins/assets/index.json",
            filterGroups: [
                {
                    key: "type",
                    label: "types",
                    values: (item) => [item.type],
                },
                {
                    key: "author",
                    label: "authors",
                    values: (item) => [item.author],
                },
                {
                    key: "tags",
                    label: "tags",
                    values: (item) => item.tags || [],
                },
            ],
            searchable: (item) => [
                item.title,
                item.author,
                item.type,
                item.id,
                ...(item.tags || []),
            ],
            date: (item) => item.date,
            id: (item) => Number(item.id) || 0,
            render: renderSkin,
        },

        {
            key: "sspm",
            label: "SSPM Archive",
            page: "/ss-hub/sspm-archive/",
            source: "/ss-hub/sspm-archive/sspm.json",
            filterGroups: [
                {
                    key: "pattern",
                    label: "patterns",
                    values: (item) =>
                        Array.isArray(item.pattern)
                            ? item.pattern
                            : item.pattern
                              ? [item.pattern]
                              : [],
                },
                {
                    key: "rating",
                    label: "ratings",
                    values: (item) => [item.rating],
                },
                {
                    key: "mapper",
                    label: "mappers",
                    values: (item) => [item.mapper],
                },
                {
                    key: "archiver",
                    label: "archivers",
                    values: (item) => [item.archiver],
                },
            ],
            searchable: (item) => [
                item.name,
                item.mapper,
                item.archiver,
                item.rating,
                item.id,
                ...(Array.isArray(item.pattern)
                    ? item.pattern
                    : [item.pattern]),
            ],
            date: (item) => item.date,
            id: (item) => Number(item.id) || 0,
            render: renderMap,
        },

        {
            key: "settings",
            label: "Settings",
            page: "/ss-hub/settings/",
            source: "/ss-hub/settings/configs/index.json",
            filterGroups: [
                {
                    key: "format",
                    label: "formats",
                    values: (item) => [item.format],
                },
                {
                    key: "author",
                    label: "authors",
                    values: (item) => [item.author],
                },
                {
                    key: "tags",
                    label: "tags",
                    values: (item) => item.tags || [],
                },
            ],
            searchable: (item) => [
                item.title,
                item.author,
                item.format,
                item.id,
                ...(item.tags || []),
            ],
            date: (item) => item.date,
            id: (item) => Number(item.id) || 0,
            render: renderSetting,
        },
    ];

    function filterKey(datasetKey, groupKey, value) {
        return `${datasetKey}:${groupKey}:${value}`;
    }

    function getState(datasetKey, groupKey, value) {
        return (
            state.filters.get(
                filterKey(
                    datasetKey,
                    groupKey,
                    value,
                ),
            ) || "neutral"
        );
    }

    function cycleFilter(
        datasetKey,
        groupKey,
        value,
        button,
    ) {
        const current = getState(
            datasetKey,
            groupKey,
            value,
        );

        const next =
            current === "neutral"
                ? "include"
                : current === "include"
                  ? "exclude"
                  : "neutral";

        const key = filterKey(
            datasetKey,
            groupKey,
            value,
        );

        if (next === "neutral") {
            state.filters.delete(key);
        } else {
            state.filters.set(key, next);
        }

        button.classList.remove(
            "state-neutral",
            "state-include",
            "state-exclude",
        );

        button.classList.add(
            `state-${next}`,
        );

        renderResults();
    }

    function filterValues(
        dataset,
        group,
    ) {
        return [
            ...new Set(
                dataset.items
                    .flatMap(group.values)
                    .filter(Boolean),
            ),
        ].sort((a, b) =>
            String(a).localeCompare(
                String(b),
            ),
        );
    }

    function renderFilters() {
        const container =
            document.getElementById(
                "universal-filters",
            );

        container.innerHTML =
            state.datasets
                .map((dataset) => {
                    const enabled =
                        state.enabledDatasets.get(
                            dataset.key,
                        ) !== false;

                    return `
                <details class="universal-search-filter-group${enabled ? "" : " is-disabled"}" data-dataset-section="${escapeHtml(dataset.key)}">
                    <summary>
                        <span>${escapeHtml(dataset.label)}</span>

                        <button
                            type="button"
                            class="universal-search-section-toggle"
                            data-dataset-toggle="${escapeHtml(dataset.key)}"
                            aria-label="Toggle ${escapeHtml(dataset.label)}"
                            aria-pressed="${enabled ? "true" : "false"}"
                        >
                            <span
                                class="universal-search-toggle-track"
                                aria-hidden="true"
                            ></span>
                        </button>
                    </summary>

                    <div
                        class="universal-search-filter-content"
                        data-dataset-content="${escapeHtml(dataset.key)}"
                        ${enabled ? "" : " hidden"}
                    >
                        ${dataset.filterGroups
                            .map((group) => {
                                const values =
                                    filterValues(
                                        dataset,
                                        group,
                                    );

                                if (!values.length) {
                                    return "";
                                }

                                return `
                                <div class="universal-search-filter-group-block">
                                    <span class="filter-label">
                                        ${escapeHtml(group.label)}
                                    </span>

                                    <div class="universal-search-filter-list">
                                        ${values
                                            .map(
                                                (
                                                    value,
                                                ) => {
                                                    const filterState =
                                                        getState(
                                                            dataset.key,
                                                            group.key,
                                                            value,
                                                        );

                                                    return `
                                                        <button
                                                            type="button"
                                                            class="universal-search-filter state-${filterState}"
                                                            data-dataset="${escapeHtml(dataset.key)}"
                                                            data-group="${escapeHtml(group.key)}"
                                                            data-value="${escapeHtml(value)}"
                                                        >
                                                            ${escapeHtml(value)}
                                                        </button>
                                                    `;
                                                },
                                            )
                                            .join("")}
                                    </div>
                                </div>
                            `;
                            })
                            .join("")}
                    </div>
                </details>
            `;
                })
                .join("");

        container.addEventListener(
            "click",
            (event) => {
                const toggle =
                    event.target.closest(
                        "[data-dataset-toggle]",
                    );

                if (toggle) {
                    event.preventDefault();
                    event.stopPropagation();

                    const datasetKey =
                        toggle.dataset
                            .datasetToggle;

                    const enabled =
                        state.enabledDatasets.get(
                            datasetKey,
                        ) !== false;

                    const nextEnabled =
                        !enabled;

                    state.enabledDatasets.set(
                        datasetKey,
                        nextEnabled,
                    );

                    toggle.setAttribute(
                        "aria-pressed",
                        String(
                            nextEnabled,
                        ),
                    );

                    const section =
                        container.querySelector(
                            `[data-dataset-section="${CSS.escape(datasetKey)}"]`,
                        );

                    const content =
                        container.querySelector(
                            `[data-dataset-content="${CSS.escape(datasetKey)}"]`,
                        );

                    if (section) {
                        section.classList.toggle(
                            "is-disabled",
                            !nextEnabled,
                        );
                    }

                    if (content) {
                        content.hidden =
                            !nextEnabled;
                    }

                    const clamp = () => {
                        const maxScroll =
                            Math.max(
                                0,
                                container.scrollHeight -
                                    container.clientHeight,
                            );

                        if (
                            container.scrollTop >
                            maxScroll
                        ) {
                            container.scrollTop =
                                maxScroll;
                        }
                    };

                    clamp();

                    requestAnimationFrame(
                        () => {
                            clamp();

                            requestAnimationFrame(
                                clamp,
                            );
                        },
                    );

                    renderResults();
                    return;
                }

                const button =
                    event.target.closest(
                        ".universal-search-filter",
                    );

                if (button) {
                    cycleFilter(
                        button.dataset
                            .dataset,
                        button.dataset.group,
                        button.dataset.value,
                        button,
                    );
                }
            },
            true,
        );
    }

    function matchesFilters(
        dataset,
        item,
    ) {
        return dataset.filterGroups.every(
            (group) => {
                const values =
                    group.values(item);

                const included =
                    filterValues(
                        dataset,
                        group,
                    ).filter(
                        (value) =>
                            getState(
                                dataset.key,
                                group.key,
                                value,
                            ) ===
                            "include",
                    );

                const excluded =
                    filterValues(
                        dataset,
                        group,
                    ).filter(
                        (value) =>
                            getState(
                                dataset.key,
                                group.key,
                                value,
                            ) ===
                            "exclude",
                    );

                if (
                    values.some(
                        (value) =>
                            excluded.includes(
                                value,
                            ),
                    )
                ) {
                    return false;
                }

                return (
                    included.length ===
                        0 ||
                    included.every(
                        (value) =>
                            values.includes(
                                value,
                            ),
                    )
                );
            },
        );
    }

    function renderResults() {
        const container =
            document.getElementById(
                "universal-results",
            );

        const query =
            state.query.trim();

        const groups =
            state.datasets
                .filter(
                    (dataset) =>
                        state.enabledDatasets.get(
                            dataset.key,
                        ) !== false,
                )
                .map((dataset) => {
                    const results =
                        dataset.items
                            .filter((item) =>
                                matchesTextQuery(
                                    query,
                                    dataset.searchable(
                                        item,
                                    ),
                                ),
                            )
                            .filter((item) =>
                                matchesFilters(
                                    dataset,
                                    item,
                                ),
                            )
                            .sort(
                                (a, b) => {
                                    const dateDiff =
                                        String(
                                            dataset.date(
                                                b,
                                            ) || "",
                                        ).localeCompare(
                                            String(
                                                dataset.date(
                                                    a,
                                                ) || "",
                                            ),
                                        );

                                    return (
                                        dateDiff ||
                                        dataset.id(
                                            b,
                                        ) -
                                            dataset.id(
                                                a,
                                            )
                                    );
                                },
                            );

                    return {
                        dataset,
                        results,
                    };
                })
                .filter(
                    (group) =>
                        group.results.length >
                        0,
                );

        if (!groups.length) {
            container.innerHTML =
                '<p class="universal-search-empty">no results found.</p>';

            return;
        }

        container.innerHTML =
            groups
                .map(
                    ({
                        dataset,
                        results,
                    }) => `
            <section
                class="universal-search-result-group"
                aria-labelledby="search-group-${dataset.key}"
            >
                <div class="universal-search-result-heading">
                    <h2 id="search-group-${dataset.key}">
                        <a href="${escapeHtml(dataset.page)}">
                            ${escapeHtml(dataset.label)}
                        </a>
                    </h2>

                    <span class="universal-search-result-count">
                        ${results.length}
                        result${results.length === 1 ? "" : "s"}
                    </span>
                </div>

                ${results
                    .map((item) =>
                        dataset.render(item),
                    )
                    .join("")}
            </section>
        `,
                )
                .join("");

        bindActions(container);
    }

    function cardShell(
        item,
        meta,
        body,
        actions = "",
        preview = "",
    ) {
        return `
            <article class="universal-search-card">
                <div class="card-top-row">
                    ${meta}
                </div>

                <h3 class="universal-search-card-title">
                    ${body.title}
                </h3>

                <div class="universal-search-card-meta">
                    ${body.meta || ""}
                </div>

                ${
                    preview
                        ? `<div class="universal-search-preview">${preview}</div>`
                        : ""
                }

                ${
                    actions
                        ? `<div class="universal-search-card-actions">${actions}</div>`
                        : ""
                }
            </article>
        `;
    }

    function renderArticle(item) {
        return cardShell(
            item,

            `<span class="card-number">#${escapeHtml(item.id)}</span>
             <span class="card-dot">·</span>
             <span class="card-date">${escapeHtml(item.date)}</span>`,

            {
                title: escapeHtml(
                    item.title,
                ),

                meta: `${escapeHtml(item.author || "")}${
                    item.tags?.length
                        ? ` · ${renderTags(item.tags)}`
                        : ""
                }`,
            },

            `<a href="/articles/reader.html?post=${encodeURIComponent(item.id)}">
                open article
            </a>`,
        );
    }

    function renderSSArticle(item) {
        return cardShell(
            item,

            `<span class="card-number">#${escapeHtml(item.id)}</span>
             <span class="card-dot">·</span>
             <span class="card-date">${escapeHtml(item.date)}</span>`,

            {
                title: escapeHtml(
                    item.title,
                ),

                meta: `${escapeHtml(item.author || "")}${
                    item.tags?.length
                        ? ` · ${renderTags(item.tags)}`
                        : ""
                }`,
            },

            `<a href="/ss-hub/articles/reader.html?post=${encodeURIComponent(item.id)}">
                open article
            </a>`,
        );
    }

    function renderMap(item) {
        const patterns =
            Array.isArray(item.pattern)
                ? item.pattern
                : item.pattern
                  ? [item.pattern]
                  : [];

        return cardShell(
            item,

            `<span class="card-number">#${escapeHtml(item.id)}</span>
             <span class="card-dot">·</span>
             <span class="card-date">${escapeHtml(item.date)}</span>
             ${patterns
                 .map(
                     (p) =>
                         `<span class="card-tag">${escapeHtml(p)}</span>`,
                 )
                 .join("")}`,

            {
                title: escapeHtml(
                    item.name,
                ),

                meta: `mapped by ${escapeHtml(item.mapper)} · ${escapeHtml(item.rating)} · archived by ${escapeHtml(item.archiver)}`,
            },

            `<a
                href="${escapeHtml(item.link)}"
                target="_blank"
                rel="noopener noreferrer"
                download
            >
                download map
            </a>`,
        );
    }

    function renderSkin(item) {
        const typeLabels = {
            "ss-skin": "ss skin",
            "ss-cursor": "ss cursor",
            "ssp-cursor": "ssp cursor",
            "ssp-hit": "ssp hit",
            "ssp-miss": "ssp miss",
            "ssp-mesh": "ssp mesh",
        };

        let preview = "";

        if (item.type === "ss-skin") {
            const youtube =
                getYouTubeData(
                    item.video,
                );

            if (youtube) {
                preview = `
                    <iframe
                        src="${youtube.embedUrl}"
                        loading="lazy"
                        allowfullscreen
                        title="${escapeHtml(item.title)} preview"
                    ></iframe>
                `;
            }
        } else if (
            [
                "ss-cursor",
                "ssp-cursor",
            ].includes(item.type) &&
            item.file
        ) {
            const previewMap = {
                "002.png":
                    "002.webp",
                "003.png":
                    "003.webp",
                "006.png":
                    "006-preview.webp",
                "007.png":
                    "007-preview.webp",
                "008.png":
                    "008-preview.webp",
            };

            preview = `
                <img
                    src="/ss-hub/skins/assets/${escapeHtml(
                        previewMap[
                            item.file
                        ] ||
                            item.file,
                    )}"
                    alt="${escapeHtml(item.title)} preview"
                    loading="lazy"
                >
            `;
        } else if (
            [
                "ssp-hit",
                "ssp-miss",
            ].includes(item.type)
        ) {
            preview = `
                <audio
                    controls
                    src="/ss-hub/skins/assets/${escapeHtml(item.file)}"
                ></audio>
            `;
        }

        let actions = "";

        if (
            item.type ===
            "ss-skin"
        ) {
            actions = `
                <button
                    type="button"
                    data-copy-file="/ss-hub/skins/assets/${escapeHtml(item.id)}.json"
                >
                    copy skin
                </button>
            `;
        } else if (
            item.type ===
            "ss-cursor"
        ) {
            actions = `
                <button
                    type="button"
                    data-copy-text="${escapeHtml(item.code || "")}"
                >
                    copy cursor
                </button>
            `;
        } else if (item.file) {
            actions = `
                <a
                    href="/ss-hub/skins/assets/${escapeHtml(item.file)}"
                    download="${escapeHtml(item.title)}"
                >
                    download
                </a>
            `;
        }

        return cardShell(
            item,

            `<span class="card-number">#${escapeHtml(item.id)}</span>
             <span class="card-dot">·</span>
             <span class="card-date">${escapeHtml(item.date)}</span>
             <span class="card-tag">${escapeHtml(typeLabels[item.type] || item.type)}</span>`,

            {
                title: escapeHtml(
                    item.title,
                ),

                meta: `${escapeHtml(item.author)}${
                    item.tags?.length
                        ? ` · ${renderTags(item.tags)}`
                        : ""
                }`,
            },

            actions,
            preview,
        );
    }

    function renderSetting(item) {
        const youtube =
            getYouTubeData(
                item.video,
            );

        const preview = youtube
            ? `
                <iframe
                    src="${youtube.embedUrl}"
                    loading="lazy"
                    allowfullscreen
                    title="${escapeHtml(item.title)} preview"
                ></iframe>
            `
            : "";

        return cardShell(
            item,

            `<span class="card-number">#${escapeHtml(item.id)}</span>
             <span class="card-dot">·</span>
             <span class="card-date">${escapeHtml(item.date)}</span>
             <span class="card-tag">${escapeHtml(item.format)}</span>`,

            {
                title: escapeHtml(
                    item.title,
                ),

                meta: `${escapeHtml(item.author || "")}${
                    item.tags?.length
                        ? ` · ${renderTags(item.tags)}`
                        : ""
                }`,
            },

            `<a href="/ss-hub/settings/?config=${encodeURIComponent(item.id)}">
                open settings
            </a>`,

            preview,
        );
    }

    /*
     * Bind copy actions for universal-search results.
     *
     * Uses AnsilianUtils.copyText() instead of directly calling
     * navigator.clipboard.writeText(), allowing the same fallback
     * to work on local/non-secure hosts.
     */
    function bindActions(container) {
        container
            .querySelectorAll(
                "[data-copy-text]",
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        const original =
                            button.textContent;

                        const success =
                            await window.AnsilianUtils.copyText(
                                button.dataset
                                    .copyText,
                            );

                        if (success) {
                            button.textContent =
                                "copied!";

                            setTimeout(
                                () => {
                                    button.textContent =
                                        original;
                                },
                                2000,
                            );
                        } else {
                            button.textContent =
                                "copy failed";

                            setTimeout(
                                () => {
                                    button.textContent =
                                        original;
                                },
                                2000,
                            );
                        }
                    },
                );
            });

        container
            .querySelectorAll(
                "[data-copy-file]",
            )
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        const original =
                            button.textContent;

                        try {
                            const response =
                                await fetch(
                                    button.dataset
                                        .copyFile,
                                );

                            if (
                                !response.ok
                            ) {
                                throw new Error(
                                    "copy source unavailable",
                                );
                            }

                            const text =
                                await response.text();

                            const success =
                                await window.AnsilianUtils.copyText(
                                    text,
                                );

                            if (!success) {
                                throw new Error(
                                    "clipboard copy failed",
                                );
                            }

                            button.textContent =
                                "copied!";

                            setTimeout(
                                () => {
                                    button.textContent =
                                        original;
                                },
                                2000,
                            );
                        } catch (error) {
                            console.error(
                                "Could not copy file:",
                                error,
                            );

                            button.textContent =
                                "copy failed";

                            setTimeout(
                                () => {
                                    button.textContent =
                                        original;
                                },
                                2000,
                            );
                        }
                    },
                );
            });
    }

    async function load() {
        const results =
            await Promise.all(
                DATASETS.map(
                    async (dataset) => {
                        try {
                            const response =
                                await fetch(
                                    dataset.source,
                                );

                            if (
                                !response.ok
                            ) {
                                throw new Error(
                                    `Could not load ${dataset.source}`,
                                );
                            }

                            return {
                                ...dataset,
                                items:
                                    await response.json(),
                            };
                        } catch (error) {
                            console.error(
                                error,
                            );

                            return {
                                ...dataset,
                                items: [],
                            };
                        }
                    },
                ),
            );

        state.datasets =
            results;

        state.datasets.forEach(
            (dataset) =>
                state.enabledDatasets.set(
                    dataset.key,
                    true,
                ),
        );

        renderFilters();
        renderResults();

        document
            .getElementById(
                "universal-search-input",
            )
            .addEventListener(
                "input",
                (event) => {
                    state.query =
                        event.target.value;

                    renderResults();
                },
            );
    }

    document.addEventListener(
        "DOMContentLoaded",
        load,
    );
})();
