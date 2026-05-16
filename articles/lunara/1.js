const params = new URLSearchParams(window.location.search);
const id = params.get("id");

fetch(`/articles/lunara/${id}.md`)
  .then((res) => res.text())
  .then((md) => {
    // split metadata + content
    const parts = md.split("===");

    const content = parts[1] || md;

    document.getElementById("article").innerHTML = marked.parse(content);
  });
