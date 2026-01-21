// ===================================================
// DOM
// ===================================================
const container = document.getElementById("emojiContainer");
const searchInput = document.getElementById("search");
const toast = document.getElementById("toast");

const skinButtons = document.querySelectorAll(".skin-tone button");

const categoryNav = document.querySelector(".category-nav");
const categoryPopup = document.getElementById("categoryPopup");

const emojiTray = document.getElementById("emojiTray");
const trayEmojis = document.getElementById("trayEmojis");
const trayCopy = document.getElementById("trayCopy");
const trayClear = document.getElementById("trayClear");


// ===================================================
// CATEGORY ICON MAP
// ===================================================
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


// ===================================================
// STATE
// ===================================================
const state = {
  data: [],
  search: "",
  skinIndex: 0,
};

const selectedEmojis = [];

let observer = null;
let currentCategoryId = null;
let popupTimeout = null;

let tooltipTimer = null;
let lastEmoji = null;


// ===================================================
// INIT
// ===================================================
fetch("/data/emojis.json")
  .then(res => res.json())
  .then(data => {
    state.data = data;
    update();
  })
  .catch(err => console.error("fetch error:", err));


// ===================================================
// EVENTS
// ===================================================

// search
searchInput.addEventListener("input", e => {
  state.search = e.target.value.toLowerCase();

  categoryNav.classList.toggle("hidden", !!state.search);
  update();
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

// emoji click
container.addEventListener("click", e => {
  const emojiEl = e.target.closest(".emoji");
  if (!emojiEl) return;

  const emoji = emojiEl.dataset.emoji;

  copyToClipboard(emoji);
  selectedEmojis.push(emoji);
  renderTray();

  emojiEl.classList.add("clicked");
  setTimeout(() => emojiEl.classList.remove("clicked"), 120);
});

// category click
categoryNav.addEventListener("click", e => {
  const btn = e.target.closest(".category-btn");
  if (!btn) return;

  document
    .getElementById(btn.dataset.id)
    ?.scrollIntoView({ behavior: "smooth" });
});


// ===================================================
// UPDATE PIPELINE
// ===================================================
function update() {
  const filtered = getFilteredData();
  renderCategories(filtered);
  renderCategoryNav(filtered);
  observeCategories();
}


// ===================================================
// DATA HELPERS
// ===================================================
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


// ===================================================
// RENDER EMOJIS
// ===================================================
function renderCategories(categories) {
  container.innerHTML = categories.map(cat => `
    <section class="category" id="${cat.id}">
      <h2>${cat.title}</h2>
      <div class="grid">
        ${cat.items.map(e => {
          const emoji = getEmojiWithSkin(e);
          return `
            <div
              class="emoji"
              data-emoji="${emoji}"
              data-name="${e.name.replace(/-/g, " ")}"
            >
              ${emoji}
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `).join("");
}


// ===================================================
// CATEGORY NAV
// ===================================================
function renderCategoryNav(categories) {
  categoryNav.innerHTML = categories.map(cat => `
    <button
      class="category-btn"
      data-id="${cat.id}"
      title="${cat.title}"
    >
      <img
        src="icons/${CATEGORY_ICONS[cat.id]}"
        class="category-icon"
        alt="${cat.title}"
      />
    </button>
  `).join("");
}


// ===================================================
// INTERSECTION OBSERVER
// ===================================================
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

    const activeBtn =
      categoryNav.querySelector(`[data-id="${id}"]`);

    activeBtn?.classList.add("active");

    const title = visible.target.querySelector("h2")?.textContent;
    showCategoryPopup(title);

  }, {
    threshold: [0.3, 0.6]
  });

  document
    .querySelectorAll(".category")
    .forEach(section => observer.observe(section));
}


// ===================================================
// CATEGORY POPUP
// ===================================================
function showCategoryPopup(text) {
  if (!text) return;

  categoryPopup.textContent = text;
  categoryPopup.classList.add("show");

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    categoryPopup.classList.remove("show");
  }, 1200);
}


// ===================================================
// TOOLTIP (emoji name)
// ===================================================
const tooltip = document.createElement("div");
tooltip.className = "emoji-tooltip";
document.body.appendChild(tooltip);

container.addEventListener("mouseover", e => {
  const emojiEl = e.target.closest(".emoji");
  if (!emojiEl) return;

  clearTimeout(tooltipTimer);

  tooltipTimer = setTimeout(() => {
    if (lastEmoji === emojiEl) return;
    lastEmoji = emojiEl;

    const rect = emojiEl.getBoundingClientRect();

    tooltip.textContent = emojiEl.dataset.name;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 6}px`;

    tooltip.classList.add("show");
  }, 110);
});

container.addEventListener("mouseout", () => {
  clearTimeout(tooltipTimer);
  lastEmoji = null;
  tooltip.classList.remove("show");
});


// ===================================================
// EMOJI TRAY
// ===================================================
function renderTray() {
  if (selectedEmojis.length < 2) {
    emojiTray.classList.remove("show");
    return;
  }

  trayEmojis.innerHTML = selectedEmojis
    .map(e => `<span class="tray-emoji">${e}</span>`)
    .join("");

  emojiTray.classList.add("show");
}

trayCopy.addEventListener("click", () => {
  if (!selectedEmojis.length) return;

  navigator.clipboard.writeText(selectedEmojis.join(""));

  trayCopy.textContent = "Copied";
  trayCopy.disabled = true;

  setTimeout(() => {
    selectedEmojis.length = 0;
    renderTray();

    trayCopy.textContent = "Copy";
    trayCopy.disabled = false;
  }, 700);
});

trayClear.addEventListener("click", () => {
  selectedEmojis.length = 0;
  renderTray();
});


// ===================================================
// HELPERS
// ===================================================
function copyToClipboard(text) {
  navigator.clipboard.writeText(text);

  toast.textContent = "Copied!";
  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 700);
}
