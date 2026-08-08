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

    /*
     * Copy text to the clipboard.
     *
     * First tries the modern Clipboard API.
     * If that is unavailable or blocked (common on non-secure local
     * hosts), falls back to the older textarea + execCommand method.
     *
     * Returns true when copying succeeds and false when it fails.
     */
    async function copyText(text) {
        const value = String(text ?? "");

        if (!value) return false;

        // Modern Clipboard API.
        if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function"
        ) {
            try {
                await navigator.clipboard.writeText(value);
                return true;
            } catch (error) {
                // Continue to the fallback below.
            }
        }

        // Legacy fallback for local/non-secure contexts.
        try {
            const textarea = document.createElement("textarea");

            textarea.value = value;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.top = "0";
            textarea.style.left = "0";
            textarea.style.width = "1px";
            textarea.style.height = "1px";
            textarea.style.opacity = "0";
            textarea.style.pointerEvents = "none";

            document.body.appendChild(textarea);

            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);

            const successful = document.execCommand("copy");

            textarea.remove();

            return successful;
        } catch (error) {
            return false;
        }
    }

    /*
     * Download a Blob as a file.
     *
     * This is useful for generated settings/config files.
     */
    function downloadBlob(blob, filename) {
        if (!(blob instanceof Blob)) return false;

        try {
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");

            anchor.href = url;
            anchor.download = filename || "download";

            // The element needs to be attached for reliable behavior
            // across browsers, especially when running locally.
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            // Give the browser a moment to start the download before
            // releasing the object URL.
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

            return true;
        } catch (error) {
            return false;
        }
    }

    /*
     * Download a URL as a file.
     *
     * For same-origin/local files, this uses the normal download
     * attribute. If the browser refuses that approach, it falls
     * back to navigating to the URL.
     */
    function downloadFile(url, filename) {
        if (!url) return false;

        try {
            const anchor = document.createElement("a");

            anchor.href = url;
            anchor.download = filename || "";
            anchor.rel = "noopener";

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            return true;
        } catch (error) {
            return false;
        }
    }

    /*
     * Download text content as a file.
     *
     * Useful for JSON/settings/config files generated in JavaScript.
     */
    function downloadText(text, filename, mimeType = "text/plain;charset=utf-8") {
        try {
            const blob = new Blob([String(text ?? "")], {
                type: mimeType,
            });

            return downloadBlob(blob, filename);
        } catch (error) {
            return false;
        }
    }

    window.AnsilianUtils = {
        escapeHtml,
        normalize,
        uniqueSorted,
        renderTags,
        getYouTubeData,

        // Clipboard helpers
        copyText,

        // Download helpers
        downloadBlob,
        downloadFile,
        downloadText,
    };
})();
