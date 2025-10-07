// ====================== CONFIG ======================
const SUPABASE_URL = "https://igtkvfjdzbqfhjmmeuyz.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGt2ZmpkemJxZmhqbW1ldXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzUzMTUsImV4cCI6MjA3NDc1MTMxNX0.hgU932vTGI0tL50t8a99UDSwKH91aRryl6aQR_ruGJ4"

// URL de destino para Abrir Ticket (Discord)
const DISCORD_CHANNEL_URL = "https://discord.com/channels/1251620966673420380/1251620968179302482"

// ====================== SUPABASE ====================
let supabase = null
if (SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY") {
  supabase = window.supabase?.createClient?.(SUPABASE_URL, SUPABASE_ANON_KEY) || null
  console.log("[v0] Supabase client initialized for cars")
} else {
  console.warn("[v0] Supabase credentials not configured.")
}

// ====================== FALLBACK DATA ===============
const sampleCars = [
  {
    id: 1,
    nombre: "Benefactor Schafter V12",
    descripcion: "Sedán de lujo con motor V12. Elegancia y potencia en perfecta armonía.",
    precio: 85000,
    url: "/luxury-sedan.png",
    categoria_id: 1,
    estado_id: 2, // Activo
  },
  {
    id: 2,
    nombre: "Benefactor Dubsta",
    descripcion: "SUV robusto y espacioso. Perfecto para cualquier terreno.",
    precio: 65000,
    url: "/luxury-suv.png",
    categoria_id: 2,
    estado_id: 2, // Activo
  },
]

// ====================== STATUS MAPPING ==============
function getStatusInfo(estadoId) {
  const statusMap = {
    1: { nombre: "Alquilado", class: "status-alquilado" },
    2: { nombre: "Disponible", class: "status-disponible" },
    3: { nombre: "Sin stock", class: "status-sinstock" },

  }
  return statusMap[estadoId] || { nombre: "Desconocido", class: "status-borrador" }
}

// ====================== DOM =========================
const sidebar = document.getElementById("sidebar")
const openSidebarBtn = document.getElementById("openSidebar")
const closeSidebarBtn = document.getElementById("closeSidebar")
const mainContent = document.querySelector(".main-content")
const carsGrid = document.getElementById("carsGrid")
const categoryList = document.getElementById("categoryList")
const pageTitle = document.getElementById("pageTitle")
const searchInput = document.getElementById("searchInput")
const searchClear = document.getElementById("searchClear")

// ====================== STATE =======================
let categories = []
let currentCategoryId = "todos"
let allCars = []
let currentSearchTerm = ""

// ====================== SIDEBAR TOGGLE ==============
openSidebarBtn?.addEventListener("click", () => {
  sidebar?.classList.remove("hidden")
  mainContent?.classList.remove("expanded")
})
closeSidebarBtn?.addEventListener("click", () => {
  sidebar?.classList.add("hidden")
  mainContent?.classList.add("expanded")
})

// ====================== FETCH CATEGORIES ============
async function fetchCategories() {
  if (!supabase) {
    console.log("[v0] Using sample categories (Supabase not configured)")
    return [
      { id: 1, nombre: "Sedanes" },
      { id: 2, nombre: "SUVs" },
      { id: 3, nombre: "Deportivos" },
    ]
  }
  try {
    const { data, error } = await supabase.from("categoria").select("*").order("nombre", { ascending: true })
    if (error) {
      console.error("[v0] Error fetching categories:", error)
      return []
    }
    return data || []
  } catch (err) {
    console.error("[v0] Error fetching categories:", err)
    return []
  }
}

// ====================== RENDER CATEGORIES ===========
async function renderCategories() {
  if (!categoryList) return
  categories = await fetchCategories()

  categories.forEach((category) => {
    const li = document.createElement("li")
    const link = document.createElement("a")
    link.href = "#"
    link.className = "nav-link"
    link.dataset.categoryId = category.id
    link.textContent = category.nombre

    link.addEventListener("click", async (e) => {
      e.preventDefault()
      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))
      link.classList.add("active")
      currentCategoryId = category.id
      updatePageTitle(category.nombre)
      await renderCars(category.id)
    })

    li.appendChild(link)
    categoryList.appendChild(li)
  })

  const verTodoLink = document.querySelector('[data-category-id="todos"]')
  if (verTodoLink) {
    verTodoLink.addEventListener("click", async (e) => {
      e.preventDefault()
      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))
      verTodoLink.classList.add("active")
      currentCategoryId = "todos"
      updatePageTitle("VEHÍCULOS DISPONIBLES")
      await renderCars(null) // null means all categories
    })
  }
}

// ====================== FETCH CARS ==================
async function fetchCarsFromSupabase(categoryId) {
  if (!supabase) {
    console.log("[v0] Using sample data (Supabase not configured)")
    return categoryId && categoryId !== "todos"
      ? sampleCars.filter((car) => car.categoria_id === categoryId)
      : sampleCars
  }
  try {
    let query = supabase.from("carros").select("*, estado_id")
    if (categoryId && categoryId !== "todos") query = query.eq("categoria_id", categoryId)
    const { data, error } = await query
    if (error) {
      console.error("[v0] Error fetching cars:", error)
      return []
    }
    return data || []
  } catch (err) {
    console.error("[v0] Error fetching cars:", err)
    return []
  }
}

// ====================== TITLE =======================
function updatePageTitle(categoryName) {
  if (pageTitle) pageTitle.textContent = categoryName ? categoryName.toUpperCase() : "VEHÍCULOS DISPONIBLES"
}

// ====================== RENDER CARS =================
async function renderCars(categoryId) {
  if (!carsGrid) return

  carsGrid.innerHTML =
    '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);">Cargando vehículos...</div>'

  allCars = await fetchCarsFromSupabase(categoryId)

  const filteredCars = filterCars(allCars, currentSearchTerm)

  carsGrid.innerHTML = ""

  if (!filteredCars || filteredCars.length === 0) {
    const message = currentSearchTerm
      ? `No se encontraron vehículos que coincidan con "${currentSearchTerm}"`
      : "No hay vehículos disponibles en esta categoría."
    carsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);">${message}</div>`
    return
  }

  filteredCars.forEach((car, index) => {
    const card = createCarCard(car)
    carsGrid.appendChild(card)
    setTimeout(() => {
      card.style.opacity = "1"
      card.style.transform = "translateY(0)"
    }, index * 100)
  })
}

// ====================== CARD ========================
function createCarCard(car) {
  const card = document.createElement("div")
  card.className = "property-card"
  card.style.opacity = "0"
  card.style.transform = "translateY(20px)"
  card.style.transition = "all 0.5s ease"

  // Get status info
  const estadoId = car.estado_id || 2 // Default to Activo
  const statusInfo = getStatusInfo(estadoId)

  if (estadoId === 5 || estadoId === 6) {
    card.classList.add("card-eliminado")
  }

  // Precio formateado (si viene null, mostramos "—")
  const formattedPrice = typeof car.precio === "number" ? `$${car.precio.toLocaleString("es-MX")}` : car.precio || "—"
  const imageUrl = car.url || "/luxury-car-sleek-design.png"

  const category = categories.find((c) => c.id === car.categoria_id)
  const categoryName = category ? category.nombre : "Vehículo"

  card.innerHTML = `
    <div class="property-image-container">
      <div class="property-status-badge ${statusInfo.class}">${statusInfo.nombre}</div>
      <img src="${imageUrl}" alt="${car.nombre}" class="property-image" onerror="this.src='/luxury-car-sleek-design.png'">
    </div>
    <div class="property-content">
      <div class="property-category">${categoryName}</div>
      <h2 class="property-title">${car.nombre}</h2>
      <p class="property-description">${car.descripcion || ""}</p>
      <div class="property-footer">
        <div>
          <span class="property-price-label">Precio</span>
          <div class="property-price">${formattedPrice}</div>
        </div>
        <button class="buy-btn" onclick="window.open('${DISCORD_CHANNEL_URL}', '_blank', 'noopener');"> Abrir Ticket </button>
      </div>
    </div>
  `
  return card
}

// ====================== INIT ========================
async function init() {
  await renderCategories()
  await renderCars(null)
}
init()

// ====================== OUTSIDE CLICK (móvil) =======
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768 && sidebar && openSidebarBtn && mainContent) {
    if (!sidebar.contains(e.target) && !openSidebarBtn.contains(e.target)) {
      sidebar.classList.add("hidden")
      mainContent.classList.add("expanded")
    }
  }
})

// ====================== HOME LINK FORCE =============
const homeLink = document.querySelector('a.nav-link[href$="index.html"]')
if (homeLink) {
  homeLink.addEventListener(
    "click",
    (e) => {
      e.stopImmediatePropagation()
      const onIndex = /index\.html$/.test(location.pathname) || location.pathname.endsWith("/")
      if (!onIndex) {
        window.location.assign(homeLink.getAttribute("href"))
      }
    },
    true,
  )
}

// ====================== SEARCH FUNCTIONALITY ========
function filterCars(cars, searchTerm) {
  if (!searchTerm || searchTerm.trim() === "") {
    return cars
  }

  const term = searchTerm.toLowerCase().trim()

  return cars.filter((car) => {
    const nombre = (car.nombre || "").toLowerCase()
    const descripcion = (car.descripcion || "").toLowerCase()

    return nombre.includes(term) || descripcion.includes(term)
  })
}

function updateSearchResults() {
  const filteredCars = filterCars(allCars, currentSearchTerm)

  carsGrid.innerHTML = ""

  if (filteredCars.length === 0) {
    const message = currentSearchTerm
      ? `No se encontraron vehículos que coincidan con "${currentSearchTerm}"`
      : "No hay vehículos disponibles en esta categoría."
    carsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);">${message}</div>`
    return
  }

  filteredCars.forEach((car, index) => {
    const card = createCarCard(car)
    carsGrid.appendChild(card)

    setTimeout(() => {
      card.style.opacity = "1"
      card.style.transform = "translateY(0)"
    }, index * 50)
  })
}

// Search input event listeners
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    currentSearchTerm = e.target.value

    // Show/hide clear button
    if (searchClear) {
      searchClear.style.display = currentSearchTerm ? "flex" : "none"
    }

    updateSearchResults()
  })
}

if (searchClear) {
  searchClear.addEventListener("click", () => {
    currentSearchTerm = ""
    searchInput.value = ""
    searchClear.style.display = "none"
    updateSearchResults()
    searchInput.focus()
  })
}
