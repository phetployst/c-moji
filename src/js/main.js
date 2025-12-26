const container = document.getElementById("emojiContainer");
const searchInput = document.getElementById("search");
const toast = document.getElementById("toast");

let emojiData = [];

fetch("/data/emojis.json")
  .then(res => res.json())
  .then(data => {
    emojiData = data;
    render(data);
  })
  .catch(err => console.error("fetch error:", err));

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();

  const filtered = emojiData
    .map(cat => ({
      ...cat,
      items: cat.items.filter(e =>
        e.name.toLowerCase().includes(q)
      )
    }))
    .filter(cat => cat.items.length > 0);

  render(filtered);
});

function render(categories) {
  container.innerHTML = categories.map(cat => `
    <section class="category" id="${cat.id}">
      <h2>${cat.title}</h2>
      <div class="grid">
        ${cat.items.map(e => `
          <div class="emoji" onclick="copyEmoji('${e.symbol}')">
            ${e.symbol}
          </div>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function copyEmoji(emoji) {
  navigator.clipboard.writeText(emoji);
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 800);
}
