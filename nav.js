// Loads the topbar and centers the nav correctly for both odd and even button counts.
// In each page: <div id="topbar-container"></div><script src="/nav.js"></script>

function alignCenterNav() {
  const nav = document.querySelector(".center-nav");
  if (!nav) return;

  const links = [...nav.querySelectorAll("a")];
  const count = links.length;
  if (count === 0) return;

  // reset any previous adjustment before recalculating
  nav.style.transform = "";

  const pageCenter = window.innerWidth / 2;

  if (count % 2 === 1) {
    // odd number of buttons: put the middle button's center at the page center
    const middleLink = links[Math.floor(count / 2)];
    const r = middleLink.getBoundingClientRect();
    const buttonCenter = r.left + r.width / 2;
    const offset = pageCenter - buttonCenter;
    nav.style.transform = `translateX(${offset}px)`;
  } else {
    // even number of buttons: put the gap between the two middle buttons at the page center
    const leftOfGap = links[count / 2 - 1];
    const rightOfGap = links[count / 2];
    const gapCenter =
      (leftOfGap.getBoundingClientRect().right +
        rightOfGap.getBoundingClientRect().left) /
      2;
    const offset = pageCenter - gapCenter;
    nav.style.transform = `translateX(${offset}px)`;
  }
}

// load the topbar then align
fetch("/topbar.html")
  .then((r) => r.text())
  .then((html) => {
    document.getElementById("topbar-container").innerHTML = html;
    alignCenterNav();
  });

// re-align if the window is resized
window.addEventListener("resize", alignCenterNav);
