const feedUrl =
  "https://www.datamarked.dk/?id=8016&apikey=4565F1EC5B3CC964C98DE8F5D8D4B37BAA397EFA8A3C335FC226B5078224BCE6";

let allProducts = [];
let activeProducts = [];
let visibleProductsCount = 8;

const container = document.getElementById("products");
const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMoreBtn");

const filterToggle = document.getElementById("filterToggle");
const filtersPanel = document.getElementById("filtersPanel");

const materialFilter = document.getElementById("materialFilter");
const colorFilter = document.getElementById("colorFilter");
const sortFilter = document.getElementById("sortFilter");

const applyFiltersButton = document.getElementById("applyFilters");
const resetFiltersButton = document.getElementById("resetFilters");

const productModal = document.getElementById("productModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

async function loadProducts() {
  try {
    const response = await fetch(feedUrl);

    if (!response.ok) {
      throw new Error("Feed kunne ikke hentes");
    }

    const data = await response.json();

    allProducts = data.products || data;

    allProducts = allProducts.filter(product => {
      const title = (product.title || "").toLowerCase();
      const category = (product.category || "").toLowerCase();

      return (
        title.includes("filament") ||
        category.includes("filament") ||
        category.includes("3dfilament")
      );
    });

    updateFilterOptions();
    applyFilters();
  } catch (error) {
    console.error("Fejl ved hentning af data:", error);
    container.innerHTML = `<p class="message">Kunne ikke indlæse produkter.</p>`;
  }
}

function getProductData(product) {
  const normalPrice = product.price || "";
  const salePrice =
    product.sale_price && product.sale_price !== "0 DKK"
      ? product.sale_price
      : null;

  return {
    id: product.id || "",
    sku: product.sku || "",
    ean: product.ean || "",
    name: product.title || product.name || "Ukendt produkt",
    image: product.image || "",
    url: product.link || product.url || "#",
    category: product.category || "",
    price: salePrice || normalPrice || "Pris ikke oplyst",
    normalPrice,
    salePrice,
    stock: product.stock || "0",
    material: getMaterial(product),
    color: getColor(product),
    description: product.description || "",
    longDescription: product.long_description || product.description || ""
  };
}

function getMaterial(product) {
  const title = (product.title || "").toLowerCase();

  if (title.includes("chameleon")) return "PLA++ Chameleon";
  if (title.includes("transparent")) return "Transparent PLA++";
  if (title.includes("flexible")) return "Flexible PLA++";
  if (title.includes("silky") || title.includes("silk")) return "Silky PLA++";
  if (title.includes("matte")) return "PLA++ Matte";
  if (title.includes("petg")) return "PETG";
  if (title.includes("abs")) return "ABS";
  if (title.includes("pla++")) return "PLA++";
  if (title.includes("pla")) return "PLA";

  return "Andet";
}

function getColor(product) {
  const title = (product.title || "").toLowerCase();

  const colors = [
    { key: "hvid", label: "Hvid" },
    { key: "white", label: "Hvid" },
    { key: "sort", label: "Sort" },
    { key: "black", label: "Sort" },
    { key: "grå", label: "Grå" },
    { key: "gray", label: "Grå" },
    { key: "gul", label: "Gul" },
    { key: "yellow", label: "Gul" },
    { key: "grøn", label: "Grøn" },
    { key: "green", label: "Grøn" },
    { key: "rød", label: "Rød" },
    { key: "red", label: "Rød" },
    { key: "blå", label: "Blå" },
    { key: "blue", label: "Blå" },
    { key: "pink", label: "Pink" },
    { key: "lilla", label: "Lilla" },
    { key: "purple", label: "Lilla" },
    { key: "guld", label: "Guld" },
    { key: "gold", label: "Guld" },
    { key: "sølv", label: "Sølv" },
    { key: "silver", label: "Sølv" },
    { key: "bronze", label: "Bronze" },
    { key: "transparent", label: "Transparent" },
    { key: "brown", label: "Brun" },
    { key: "kobber", label: "Kobber" },
    { key: "copper", label: "Kobber" }
  ];

  const foundColors = colors
    .filter(color => title.includes(color.key))
    .map(color => color.label);

  return foundColors.length ? [...new Set(foundColors)].join(", ") : "Andet";
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || div.innerText || "";
}

function getShortText(html, maxLength = 350) {
  const text = stripHtml(html).trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() + "..." : text;
}

function getNumericPrice(price) {
  const number = Number(
    String(price)
      .replace("DKK", "")
      .replace("kr.", "")
      .replace("kr", "")
      .replace(".", "")
      .replace(",", ".")
      .trim()
  );

  return Number.isNaN(number) ? 0 : number;
}

function updateFilterOptions() {
  const materials = [...new Set(allProducts.map(product => getProductData(product).material))].sort();

  const colors = [
    ...new Set(
      allProducts.flatMap(product =>
        getProductData(product).color
          .split(", ")
          .map(color => color.trim())
          .filter(Boolean)
      )
    )
  ].sort();

  fillSelect(materialFilter, materials, "Alle materialer");
  fillSelect(colorFilter, colors, "Alle farver");
}

function fillSelect(selectElement, values, defaultText) {
  selectElement.innerHTML = `<option value="">${defaultText}</option>`;

  values.forEach(value => {
    selectElement.innerHTML += `<option value="${value}">${value}</option>`;
  });
}

function applyFilters() {
  const searchValue = searchInput.value.toLowerCase().trim();
  const selectedMaterial = materialFilter.value;
  const selectedColor = colorFilter.value;

  activeProducts = allProducts.filter(product => {
    const item = getProductData(product);

    const searchText = `
      ${item.name}
      ${item.sku}
      ${item.category}
      ${item.material}
      ${item.color}
      ${stripHtml(item.description)}
      ${stripHtml(item.longDescription)}
    `.toLowerCase();

    const matchesSearch = !searchValue || searchText.includes(searchValue);
    const matchesMaterial = !selectedMaterial || item.material === selectedMaterial;
    const matchesColor = !selectedColor || item.color.includes(selectedColor);

    return matchesSearch && matchesMaterial && matchesColor;
  });

  activeProducts = sortProducts(activeProducts);
  visibleProductsCount = 8;
  renderProducts(activeProducts);
}

function sortProducts(products) {
  const sortedProducts = [...products];

  sortedProducts.sort((a, b) => {
    const itemA = getProductData(a);
    const itemB = getProductData(b);

    const priceA = getNumericPrice(itemA.price);
    const priceB = getNumericPrice(itemB.price);

    if (sortFilter.value === "price_low") return priceA - priceB;
    if (sortFilter.value === "price_high") return priceB - priceA;
    if (sortFilter.value === "name_az") return itemA.name.localeCompare(itemB.name);
    if (sortFilter.value === "name_za") return itemB.name.localeCompare(itemA.name);
    if (sortFilter.value === "stock_high") return Number(itemB.stock) - Number(itemA.stock);

    return 0;
  });

  return sortedProducts;
}

function renderProducts(products) {
  container.innerHTML = "";

  const visibleProducts = products.slice(0, visibleProductsCount);

  if (!visibleProducts.length) {
    container.innerHTML = `<p class="message">Ingen produkter fundet.</p>`;
    loadMoreBtn.style.display = "none";
    return;
  }

  visibleProducts.forEach(product => {
    const item = getProductData(product);

    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">
        <img src="${item.image}" alt="${item.name}">
      </div>

      <h3>${item.name}</h3>

      <span class="badge">${item.material}</span>

      <div class="price-box">
        ${
          item.salePrice
            ? `
              <span class="old-price">${item.normalPrice}</span>
              <span class="price">${item.salePrice}</span>
            `
            : `<span class="price">${item.price}</span>`
        }
      </div>

      <button class="details-btn" data-id="${item.id}" type="button">
        Åbn
      </button>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll(".details-btn").forEach(button => {
    button.addEventListener("click", () => {
      const product = allProducts.find(item => String(item.id) === String(button.dataset.id));
      openProductModal(product);
    });
  });

  loadMoreBtn.style.display =
    visibleProductsCount < products.length ? "block" : "none";
}

function openProductModal(product) {
  const item = getProductData(product);

  modalBody.innerHTML = `
    <div class="modal-grid">
      <div class="modal-info">
        <span class="modal-label">Produkt</span>

        <h2>${item.name}</h2>

        <p class="modal-description">
          ${getShortText(item.description || item.longDescription)}
        </p>

        <div class="modal-meta">
          
          ${item.material ? `<p>Materiale: ${item.material}</p>` : ""}
          ${item.color ? `<p>Farve: ${item.color}</p>` : ""}
          
        </div>

        <div class="modal-price">
          ${
            item.salePrice
              ? `
                <span class="old-price">${item.normalPrice}</span>
                <span>${item.salePrice}</span>
              `
              : `<span>${item.price}</span>`
          }
        </div>

        <a href="${item.url}" target="_blank" rel="noopener" class="shop-btn">
          Gå til butik
        </a>

        <button class="back-btn" id="modalBackBtn" type="button">
          Tilbage
        </button>
      </div>

      <div class="modal-details">
        <div class="modal-image">
          <img src="${item.image}" alt="${item.name}">
        </div>

        <h3>Tekniske oplysninger</h3>

        <div class="spec-table">
          <div>
            <strong>Produktnavn</strong>
            <span>${item.name}</span>
          </div>

          <div>
            <strong>Materiale</strong>
            <span>${item.material}</span>
          </div>

          <div>
            <strong>Farve</strong>
            <span>${item.color}</span>
          </div>

          

          <div>
            <strong>Pris</strong>
            <span>${item.price}</span>
          </div>
        </div>

        <div class="long-description">
          ${item.longDescription}
        </div>
      </div>
    </div>
  `;

  productModal.classList.add("active");
  document.body.style.overflow = "hidden";

  document.getElementById("modalBackBtn").addEventListener("click", closeProductModal);
}

function closeProductModal() {
  productModal.classList.remove("active");
  document.body.style.overflow = "";
}

filterToggle.addEventListener("click", () => {
  filtersPanel.classList.toggle("hidden");
});

searchInput.addEventListener("input", () => {
  applyFilters();
});

applyFiltersButton.addEventListener("click", () => {
  applyFilters();
  filtersPanel.classList.add("hidden");
});

resetFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  materialFilter.value = "";
  colorFilter.value = "";
  sortFilter.value = "default";

  activeProducts = [...allProducts];
  visibleProductsCount = 8;

  renderProducts(activeProducts);
});

sortFilter.addEventListener("change", () => {
  applyFilters();
});

loadMoreBtn.addEventListener("click", () => {
  visibleProductsCount += 8;
  renderProducts(activeProducts);
});

closeModal.addEventListener("click", closeProductModal);

productModal.addEventListener("click", event => {
  if (event.target === productModal) {
    closeProductModal();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeProductModal();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const guideTabs = document.querySelectorAll(".guide-tab");
  const guidePanels = document.querySelectorAll(".guide-panel");

  guideTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.guide;

      guideTabs.forEach(btn => btn.classList.remove("active"));
      guidePanels.forEach(panel => panel.classList.remove("active"));

      tab.classList.add("active");

      const targetPanel = document.querySelector(`#guide-${target}`);

      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    });
  });
});
loadProducts();