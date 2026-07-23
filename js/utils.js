(() => {
    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function normalize(value) {
        return String(value ?? "").toLowerCase().trim();
    }

    function uniqueSorted(values) {
        return [...new Set(values.filter(Boolean))].sort();
    }

    function renderTags(tags, className = "card-tag") {
        if (!tags || tags.length === 0) return "";
        return tags
            .map((tag) => `<span class="${className}">${escapeHtml(tag)}</span>`)
            .join("");
    }

    function getYouTubeData(url) {
        if (!url) return null;

        const match = String(url).match(
            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/,
        );

        if (!match || match[2].length !== 11) return null;

        const videoId = match[2];
        return {
            id: videoId,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
    }

    window.AnsilianUtils = {
        escapeHtml,
        normalize,
        uniqueSorted,
        renderTags,
        getYouTubeData,
    };
})();
