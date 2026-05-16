const params = new URLSearchParams(window.location.search);
const id = params.get("id");

fetch("/articles/articles.json")
  .then(res => res.json())
  .then(list => {

    const article = list.find(a => a.id === id);

    if (!article) {
      document.getElementById("article").innerHTML = "Article not found.";
      return;
    }

    return fetch(article.file)
      .then(res => res.text())
      .then(md => {

        const parts = md.split("---");

        const content = parts.slice(2).join("---");

        document.getElementById("article").innerHTML = `
          <h1>${article.title}</h1>
          <p>${article.author} • ${article.date}</p>
          <hr>
          ${marked.parse(content)}
        `;
      });
  });