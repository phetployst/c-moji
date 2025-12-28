// =======================
// DOM
// =======================
const container = document.getElementById("emojiContainer");
const searchInput = document.getElementById("search");
const toast = document.getElementById("toast");
const skinButtons = document.querySelectorAll(".skin-tone button");

// =======================
// STATE
// =======================
const state = {
  data: [],
  search: "",
  skinIndex: 0,
};

// =======================
// DATA FETCH
// =======================
fetch("/data/emojis.json")
  .then(res => res.json())
  .then(data => {
    state.data = data;
    render(data);
  })
  .catch(err => console.error("fetch error:", err));

// =======================
// EVENTS
// =======================

// search
searchInput.addEventListener("input", e => {
  state.search = e.target.value.toLowerCase();
  render(getFilteredData());
});

// emoji click (event delegation)
container.addEventListener("click", e => {
  const emojiEl = e.target.closest(".emoji");
  if (!emojiEl) return;

  copyEmoji(emojiEl.dataset.emoji);
});

// skin tone selection
skinButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    skinButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    state.skinIndex = index;
    render(getFilteredData());
  });
});

// =======================
// DATA HELPERS
// =======================
function getFilteredData() {
  if (!state.search) return state.data;

  return state.data
    .map(cat => ({
      ...cat,
      items: cat.items.filter(e =>
        e.name.includes(state.search)
      ),
    }))
    .filter(cat => cat.items.length > 0);
}

function getEmojiWithSkin(emoji) {
  if (emoji.skins && emoji.skins.length > 0) {
    return emoji.skins[state.skinIndex] || emoji.symbol;
  }
  return emoji.symbol;
}

// =======================
// RENDER
// =======================
function render(categories) {
  container.innerHTML = categories.map(renderCategory).join("");
}

function renderCategory(cat) {
  return `
    <section class="category" id="${cat.id}">
      <h2>${cat.title}</h2>
      <div class="grid">
        ${cat.items.map(renderEmoji).join("")}
      </div>
    </section>
  `;
}

function renderEmoji(e) {
  const emoji = getEmojiWithSkin(e);
  return `
    <div class="emoji" data-emoji="${emoji}">
      ${emoji}
    </div>
  `;
}

// =======================
// ACTIONS
// =======================
function copyEmoji(emoji) {
  navigator.clipboard.writeText(emoji);
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 800);
}
