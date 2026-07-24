(() => {
    const { escapeHtml, getYouTubeData, renderTags } = window.AnsilianUtils;
    const {
        collectUnique,
        createToggleStateMap,
        cycleThreeState,
        matchesTextQuery,
        selectedKeys,
    } = window.AnsilianSearch;

    const state = {
        allPosts: [],
        currentSort: "newest",
        authorStates: createToggleStateMap(),
        tagStates: createToggleStateMap(),
        sectionOpen: { sort: true, authors: true, tags: true },
    };

    function toggleSection(key) {
        state.sectionOpen[key] = !state.sectionOpen[key];
        const list = document.getElementById(`list-${key}`);
        const arrow = document.getElementById(`arrow-${key}`);
        if (list) list.style.display = state.sectionOpen[key] ? "flex" : "none";
        if (arrow) arrow.classList.toggle("closed", !state.sectionOpen[key]);
        document
            .querySelector(`[data-toggle-section="${key}"]`)
            ?.setAttribute("aria-expanded", String(state.sectionOpen[key]));
    }

    function setSort(direction) {
        state.currentSort = direction;
        document
            .getElementById("sort-newest")
            ?.classList.toggle("active", direction === "newest");
        document
            .getElementById("sort-oldest")
            ?.classList.toggle("active", direction === "oldest");
        renderCards();
    }

    function cycleFilter(map, key, element) {
        const next = cycleThreeState(map, key);
        element.className = `filter-item toggle-item state-${next}`;
        element.style.textDecoration = next === "exclude" ? "line-through" : "";
        renderCards();
    }

    function buildFilterButton(label, map) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-item toggle-item state-neutral";
        button.textContent = label;
        button.addEventListener("click", () => cycleFilter(map, label, button));
        return button;
    }

    function buildSidebar() {
        const authors = collectUnique(state.allPosts, (post) => [post.author]);
        const tags = collectUnique(state.allPosts, (post) => post.tags || []);

        const authorList = document.getElementById("list-authors");
        if (authorList) {
            authorList.innerHTML = "";
            authors.forEach((author) => {
                authorList.appendChild(buildFilterButton(author, state.authorStates));
            });
        }

        const tagList = document.getElementById("list-tags");
        if (tagList) {
            tagList.innerHTML = "";
            tags.forEach((tag) => {
                tagList.appendChild(buildFilterButton(tag, state.tagStates));
            });
        }
    }

    function renderVideoFeed(posts) {
        const feedContainer = document.getElementById("video-feed-container");
        if (!feedContainer) return;

        const mediaPosts = posts.filter(
            (post) => post.video && post.video.trim() !== "",
        );

        if (mediaPosts.length === 0) {
            feedContainer.innerHTML = '<p class="no-media-text">No media attached</p>';
            return;
        }

        feedContainer.innerHTML = mediaPosts
            .map((post) => {
                const youtube = getYouTubeData(post.video);
                if (!youtube) return "";

                return `
                    <div class="video-card" data-video-url="${escapeHtml(post.video)}">
                        <div class="video-thumbnail-wrapper">
                            <img src="${youtube.thumbnail}" alt="${escapeHtml(post.title)} video thumbnail" class="video-thumbnail" width="320" height="180" loading="lazy" decoding="async">
                            <div class="play-overlay">
                                <span class="play-triangle">▶</span>
                            </div>
                        </div>
                        <div class="video-meta">
                            <h4 class="video-card-title">${escapeHtml(post.title)}</h4>
                            <span class="video-card-author">by ${escapeHtml(post.author)}</span>
                        </div>
                    </div>
                `;
            })
            .join("");

        feedContainer.querySelectorAll(".video-card").forEach((card) => {
            card.addEventListener("click", () => {
                const videoUrl = card.getAttribute("data-video-url");
                if (videoUrl) window.open(videoUrl, "_blank", "noopener,noreferrer");
            });
        });
    }

    function filterPosts() {
        const query = document.getElementById("search-input")?.value || "";
        const includedAuthors = selectedKeys(state.authorStates, "include");
        const excludedAuthors = selectedKeys(state.authorStates, "exclude");
        const includedTags = selectedKeys(state.tagStates, "include");
        const excludedTags = selectedKeys(state.tagStates, "exclude");

        return state.allPosts.filter((post) => {
            const postTags = post.tags || [];
            const matchesSearch = matchesTextQuery(query, [
                post.title,
                post.author,
                ...postTags,
            ]);
            const authorOk =
                !excludedAuthors.includes(post.author) &&
                (includedAuthors.length === 0 || includedAuthors.includes(post.author));
            const tagsOk =
                !postTags.some((tag) => excludedTags.includes(tag)) &&
                (includedTags.length === 0 ||
                    includedTags.every((tag) => postTags.includes(tag)));

            return matchesSearch && authorOk && tagsOk;
        });
    }

    async function renderCards() {
        const container = document.getElementById("posts-container");
        if (!container) return;

        try {
            const results = filterPosts().sort((a, b) =>
                state.currentSort === "newest"
                    ? Number(b.id) - Number(a.id)
                    : Number(a.id) - Number(b.id),
            );

            if (results.length === 0) {
                container.innerHTML = '<p class="status-text">no articles found.</p>';
                return;
            }

            const cards = await Promise.all(
                results.map((post) =>
                    window.renderComponent("article-card", {
                        idAttr: `article-${post.id}`,
                        href: `reader.html?post=${post.id}`,
                        number: post.id,
                        date: post.date,
                        title: post.title,
                        metaHtml: "",
                        descriptionHtml: post.description
                            ? `<div class="card-desc">${escapeHtml(post.description)}</div>`
                            : "",
                        authorHtml: "",
                        bottomHtml: `<span class="card-author">${escapeHtml(post.author)}</span>${post.tags && post.tags.length ? `<div class="card-tags">${renderTags(post.tags)}</div>` : ""}`,
                    }),
                ),
            );

            container.innerHTML = cards.join("");
        } catch (error) {
            console.error("Failed to render article cards:", error);
            container.innerHTML = '<p class="status-text">could not render articles.</p>';
        }
    }

    async function loadPosts() {
        const container = document.getElementById("posts-container");

        try {
            const response = await fetch("posts/posts.json");
            if (!response.ok) throw new Error("Could not load posts index.");

            state.allPosts = await response.json();

            if (state.allPosts.length === 0) {
                if (container) {
                    container.innerHTML = '<p class="status-text">nothing here yet.</p>';
                }
                return;
            }

            buildSidebar();
            await renderCards();
            renderVideoFeed(state.allPosts);

            document
                .getElementById("search-input")
                ?.addEventListener("input", renderCards);
        } catch (error) {
            if (container) {
                container.innerHTML = '<p class="status-text">could not load articles.</p>';
            }
            console.error("Database connection failure:", error);
        }
    }

    window.toggleSection = toggleSection;
    window.setSort = setSort;
    window.AnsilianArticles = { loadPosts, renderCards };

    document.addEventListener("DOMContentLoaded", loadPosts);
})();
