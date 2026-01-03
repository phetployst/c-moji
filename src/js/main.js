// =======================
// DOM
// =======================
const container = document.getElementById("emojiContainer");
const searchInput = document.getElementById("search");
const toast = document.getElementById("toast");
const skinButtons = document.querySelectorAll(".skin-tone button");
const categoryNav = document.querySelector(".category-nav");
const categoryPopup = document.getElementById("categoryPopup");

// =======================
// CATEGORY ICON MAP
// =======================
const CATEGORY_ICONS = {
  "smileys-emotion": "smiley.svg",
  "people-body": "user.svg",
  "animals-nature": "paw-print.svg",
  "food-drink": "bowl-food.svg",
  "travel-places": "airplane-tilt.svg",
  "activities": "beach-ball.svg",
  "objects": "bag.svg",
  "symbols": "heart.svg",
  "flags": "flag.svg",
};

// =======================
// STATE
// =======================
const state = {
  data: [],
  search: "",
  skinIndex: 0,
};

let observer = null;
let popupTimeout = null;
let currentCategoryId = null;

// =======================
// INIT
// =======================
fetch("/data/emojis.json")
  .then(res => res.json())
  .then(data => {
    state.data = data;
    update();
  })
  .catch(err => console.error("fetch error:", err));

// =======================
// EVENTS
// =======================

// search
searchInput.addEventListener("input", e => {
  state.search = e.target.value.toLowerCase();

  if (state.search) {
    categoryNav.classList.add("hidden");
  } else {
    categoryNav.classList.remove("hidden");
  }

  update();
});

// emoji click (copy)
container.addEventListener("click", e => {
  const emojiEl = e.target.closest(".emoji");
  if (!emojiEl) return;
  copyEmoji(emojiEl.dataset.emoji);
});

// skin tone
skinButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    skinButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.skinIndex = index;
    update();
  });
});

// category nav click
categoryNav.addEventListener("click", e => {
  const btn = e.target.closest(".category-btn");
  if (!btn) return;

  document
    .getElementById(btn.dataset.id)
    ?.scrollIntoView({ behavior: "smooth" });
});

// =======================
// UPDATE PIPELINE
// =======================
function update() {
  const filtered = getFilteredData();
  renderCategories(filtered);
  renderCategoryNav(filtered);
  observeCategories();
}

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
  if (emoji.skins?.length) {
    return emoji.skins[state.skinIndex] || emoji.symbol;
  }
  return emoji.symbol;
}

// =======================
// RENDER EMOJIS
// =======================
function renderCategories(categories) {
  container.innerHTML = categories.map(cat => `
    <section class="category" id="${cat.id}">
      <h2>${cat.title}</h2>
      <div class="grid">
        ${cat.items.map(e => {
    const emoji = getEmojiWithSkin(e);
    return `
            <div class="emoji" data-emoji="${emoji}">
              ${emoji}
            </div>
          `;
  }).join("")}
      </div>
    </section>
  `).join("");
}

// =======================
// RENDER CATEGORY NAV (SVG ICON)
// =======================
function renderCategoryNav(categories) {
  categoryNav.innerHTML = categories.map(cat => {
    const icon = CATEGORY_ICONS[cat.id];

    return `
      <button
        class="category-btn"
        data-id="${cat.id}"
        title="${cat.title}"
      >
        <img
          src="icons/${icon}"
          alt="${cat.title}"
          class="category-icon"
        />
      </button>
    `;
  }).join("");
}

// =======================
// INTERSECTION OBSERVER
// =======================
function observeCategories() {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const id = visible.target.id;

    if (currentCategoryId === id) return;

    currentCategoryId = id;

    document
      .querySelectorAll(".category-btn")
      .forEach(btn => btn.classList.remove("active"));

    const activeBtn = categoryNav.querySelector(
      `[data-id="${id}"]`
    );

    activeBtn?.classList.add("active");

    // === popup ===
    const title = visible.target.querySelector("h2")?.textContent;
    showCategoryPopup(title);

  }, {
    threshold: [0.25, 0.5, 0.75]
  });

  document
    .querySelectorAll(".category")
    .forEach(section => observer.observe(section));
}

// =======================
// POPUP
// =======================
function showCategoryPopup(text) {
  if (!text) return;

  categoryPopup.textContent = text;
  categoryPopup.classList.add("show");

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    categoryPopup.classList.remove("show");
  }, 1200);
}

// =======================
// ACTIONS
// =======================
function copyEmoji(emoji) {
  navigator.clipboard.writeText(emoji);
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 800);
}
