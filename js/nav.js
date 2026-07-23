(() => {
    function alignCenterNav() {
        const nav = document.querySelector(".center-nav");
        if (!nav) return;

        if (window.innerWidth <= 767) {
            nav.style.transform = "";
            return;
        }

        const links = [...nav.querySelectorAll("a")];
        const count = links.length;
        if (count === 0) return;

        nav.style.transform = "";

        const pageCenter = window.innerWidth / 2;

        if (count % 2 === 1) {
            const middleLink = links[Math.floor(count / 2)];
            const rect = middleLink.getBoundingClientRect();
            const buttonCenter = rect.left + rect.width / 2;
            nav.style.transform = `translateX(${pageCenter - buttonCenter}px)`;
            return;
        }

        const leftOfGap = links[count / 2 - 1];
        const rightOfGap = links[count / 2];
        const gapCenter =
            (leftOfGap.getBoundingClientRect().right +
                rightOfGap.getBoundingClientRect().left) /
            2;
        nav.style.transform = `translateX(${pageCenter - gapCenter}px)`;
    }

    window.AnsilianNav = { alignCenterNav };
    window.addEventListener("components:loaded", alignCenterNav);
    window.addEventListener("resize", alignCenterNav);
})();
