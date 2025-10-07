// You need to add these environment variables in your project settings:
// SUPABASE_URL and SUPABASE_ANON_KEY
const SUPABASE_URL = "https://igtkvfjdzbqfhjmmeuyz.supabase.co" // Replace with your Supabase URL
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlndGt2ZmpkemJxZmhqbW1ldXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzUzMTUsImV4cCI6MjA3NDc1MTMxNX0.hgU932vTGI0tL50t8a99UDSwKH91aRryl6aQR_ruGJ4" // Replace with your Supabase anon key

let supabase = null

// Initialize Supabase if credentials are provided
if (SUPABASE_URL !== "YOUR_SUPABASE_URL" && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY") {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  console.log("[v0] Supabase client initialized")
} else {
  console.warn("[v0] Supabase credentials not configured. Using sample data.")
}

// Sample property data (fallback if Supabase is not configured)
const sampleProperties = [
  {
    id: 1,
    category: "locales",
    nombre: "Los Santos Customs",
    descripcion:
      "Mecánico. Dirige tu propio taller mecánico, donde tendrás la responsabilidad de gestionar y garantizar su correcto funcionamiento, incluyendo una administración monetaria eficiente.",
    precios: 450000,
    urls: [
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Wlnqk94XSN6s0O86rVVVj0kJdD89Fi.png",
      "https://example.com/image2.png",
    ],
    estado_id: 2,
  },
  {
    id: 2,
    category: "restaurante",
    nombre: "Bahama Mamas",
    descripcion:
      "Restaurante y bar de lujo ubicado en el corazón de la ciudad. Perfecto para eventos sociales y negocios. Incluye cocina completamente equipada y licencia de bebidas alcohólicas.",
    precios: 680000,
    url: "/modern-restaurant-interior-with-bar.jpg",
    estado_id: 2,
  },
  {
    id: 3,
    category: "casas",
    nombre: "Villa Vinewood Hills",
    descripcion:
      "Mansión de lujo con vista panorámica a la ciudad. 5 habitaciones, 4 baños, piscina infinita, garaje para 6 vehículos. Seguridad privada 24/7 y acabados de primera calidad.",
    precios: 2500000,
    urls: ["/luxury-modern-mansion-pool.png", "/luxury-modern-mansion-pool2.png"],
    estado_id: 2,
  },
  {
    id: 4,
    category: "departamentos",
    nombre: "Eclipse Towers Penthouse",
    descripcion:
      "Penthouse de lujo en el edificio más exclusivo de la ciudad. 3 habitaciones, 3 baños, terraza privada con jacuzzi. Vistas de 360 grados y acceso a todas las amenidades del edificio.",
    precios: 1200000,
    url: "/luxury-penthouse-interior-modern.jpg",
    estado_id: 2,
  },
]

// DOM Elements
const sidebar = document.getElementById("sidebar")
const openSidebarBtn = document.getElementById("openSidebar")
const closeSidebarBtn = document.getElementById("closeSidebar")
const mainContent = document.querySelector(".main-content")
const propertiesGrid = document.getElementById("propertiesGrid")
const navLinks = document.querySelectorAll(".nav-link")
const pageTitle = document.getElementById("pageTitle")
const propertyModal = document.getElementById("propertyModal")
const modalOverlay = document.getElementById("modalOverlay")
const modalClose = document.getElementById("modalClose")
const modalCategory = document.getElementById("modalCategory")
const modalTitle = document.getElementById("modalTitle")
const modalDescription = document.getElementById("modalDescription")
const modalPrice = document.getElementById("modalPrice")
const modalBuyBtn = document.getElementById("modalBuyBtn")
const modalGallery = document.getElementById("modalGallery")
const modalMainImage = document.getElementById("modalMainImage")
const modalCarouselTrack = document.getElementById("modalCarouselTrack")
const carouselPrev = document.getElementById("carouselPrev")
const carouselNext = document.getElementById("carouselNext")
const modalCarouselContainer = document.querySelector(".modal-carousel-container")
const searchInput = document.getElementById("searchInput")
const searchClear = document.getElementById("searchClear")

let allProperties = []
let currentSearchTerm = ""

// Toggle Sidebar
openSidebarBtn.addEventListener("click", () => {
  sidebar.classList.remove("hidden")
  mainContent.classList.remove("expanded")
})

closeSidebarBtn.addEventListener("click", () => {
  sidebar.classList.add("hidden")
  mainContent.classList.add("expanded")
})

if (sidebar?.classList.contains("hidden")) {
  mainContent?.classList.add("expanded")
}

async function fetchPropertiesFromSupabase(category) {
  if (!supabase) {
    console.log("[v0] Using sample data (Supabase not configured)")
    return sampleProperties.filter((prop) => category === "todos" || prop.category === category)
  }

  try {
    let allProperties = []

    if (category === "todos") {
      // Fetch from all tables
      const [locales, restaurantes, casas, departamentos] = await Promise.all([
        supabase.from("locales").select("*"),
        supabase.from("restaurantes").select("*"),
        supabase.from("casas").select("*"),
        supabase.from("departamentos").select("*"),
      ])

      console.log("[v0] Fetched all categories:", { locales, restaurantes, casas, departamentos })

      if (locales.data) allProperties.push(...locales.data.map((item) => ({ ...item, category: "locales" })))
      if (restaurantes.data)
        allProperties.push(...restaurantes.data.map((item) => ({ ...item, category: "restaurante" })))
      if (casas.data) allProperties.push(...casas.data.map((item) => ({ ...item, category: "casas" })))
      if (departamentos.data)
        allProperties.push(...departamentos.data.map((item) => ({ ...item, category: "departamentos" })))
    } else {
      // Fetch from specific table
      const tableName = category === "restaurante" ? "restaurantes" : category
      const { data, error } = await supabase.from(tableName).select("*")

      console.log(`[v0] Fetched ${tableName}:`, { data, error })

      if (error) {
        console.error(`[v0] Error fetching ${tableName}:`, error)
        return []
      }

      allProperties = data.map((item) => ({ ...item, category }))
    }

    return allProperties
  } catch (error) {
    console.error("[v0] Error fetching properties:", error)
    return []
  }
}

// Filter Properties
let currentCategory = "todos"

navLinks.forEach((link) => {
  link.addEventListener("click", async (e) => {
    const category = link.dataset.category
    const href = link.getAttribute("href")

    // Si es Home (index.html), dejamos que navegue normal
    if (href && href.includes("index.html")) {
      return
    }

    // Para el resto (filtros internos) prevenimos la navegación
    if (category || href === "#") {
      e.preventDefault()

      // Update active state
      navLinks.forEach((l) => l.classList.remove("active"))
      link.classList.add("active")

      if (category) {
        currentCategory = category
        updatePageTitle(currentCategory)
        await renderProperties(currentCategory)
      }
    }
  })
})

function updatePageTitle(category) {
  const titles = {
    todos: "PROPIEDADES DISPONIBLES",
    locales: "LOCALES COMERCIALES",
    restaurante: "RESTAURANTES",
    casas: "CASAS RESIDENCIALES",
    departamentos: "DEPARTAMENTOS",
  }

  pageTitle.textContent = titles[category] || "PROPIEDADES DISPONIBLES"
}

async function renderProperties(category) {
  // Show loading state
  propertiesGrid.innerHTML =
    '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);">Cargando propiedades...</div>'

  // Fetch properties from Supabase
  allProperties = await fetchPropertiesFromSupabase(category)

  console.log("[v0] Rendering properties:", allProperties)

  const filteredProperties = filterProperties(allProperties, currentSearchTerm)

  // Clear grid
  propertiesGrid.innerHTML = ""

  if (filteredProperties.length === 0) {
    const message = currentSearchTerm
      ? `No se encontraron propiedades que coincidan con "${currentSearchTerm}"`
      : "No hay propiedades disponibles en esta categoría."
    propertiesGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);">${message}</div>`
    return
  }

  // Render properties
  filteredProperties.forEach((property, index) => {
    const card = createPropertyCard(property)
    propertiesGrid.appendChild(card)

    // Animate card entrance
    setTimeout(() => {
      card.style.opacity = "1"
      card.style.transform = "translateY(0)"
    }, index * 100)
  })
}

function createPropertyCard(property) {
  const card = document.createElement("div")
  card.className = "property-card"
  card.style.opacity = "0"
  card.style.transform = "translateY(20px)"
  card.style.transition = "all 0.5s ease"

  const statusInfo = getStatusInfo(property.estado_id)
  if (statusInfo.codigo === "eliminado") {
    card.classList.add("card-eliminado")
  }

  const formattedPrice =
    typeof property.precios === "number" ? `$${property.precios.toLocaleString("es-MX")}` : property.precios

  const imageUrls =
    property.urls && Array.isArray(property.urls) && property.urls.length > 0
      ? property.urls
      : property.url
        ? [property.url]
        : ["/propiedad.png"]

  card.innerHTML = `
    <div class="property-image-container">
      <div class="property-status-badge ${statusInfo.class}">${statusInfo.nombre}</div>
      <img src="${imageUrls[0]}" alt="${property.nombre}" class="property-image" loading="lazy" onerror="this.src='/propiedad.png'">
    </div>
    <div class="property-content">
      <div class="property-category">${property.category}</div>
      <h2 class="property-title">${property.nombre}</h2>
      <p class="property-description">${property.descripcion}</p>
      <div class="property-footer">
        <div>
          <span class="property-price-label">Precio</span>
          <div class="property-price">${formattedPrice}</div>
        </div>
        <button class="buy-btn" type="button">Ver Detalles</button>
      </div>
    </div>
  `

  card.addEventListener("click", (e) => {
    const ripple = document.createElement("div")
    ripple.style.position = "absolute"
    ripple.style.borderRadius = "50%"
    ripple.style.background = "rgba(63, 185, 80, 0.3)"
    ripple.style.width = ripple.style.height = "100px"
    ripple.style.left = e.clientX - card.getBoundingClientRect().left - 50 + "px"
    ripple.style.top = e.clientY - card.getBoundingClientRect().top - 50 + "px"
    ripple.style.animation = "ripple 0.6s ease-out"
    ripple.style.pointerEvents = "none"

    card.style.position = "relative"
    card.appendChild(ripple)

    setTimeout(() => ripple.remove(), 600)

    openPropertyModal(property, formattedPrice, imageUrls, statusInfo)
  })

  return card
}

function openPropertyModal(property, formattedPrice, imageUrls, statusInfo) {
  modalCategory.textContent = property.category

  modalTitle.innerHTML = `
    ${property.nombre}
    <span class="property-status-badge ${statusInfo.class}" style="position: relative; top: 0; right: 0; margin-left: 1rem; display: inline-block; vertical-align: middle;">${statusInfo.nombre}</span>
  `

  modalDescription.textContent = property.descripcion
  modalPrice.textContent = formattedPrice

  const mainImageUrl = property.url || (imageUrls && imageUrls[0]) || "/propiedad.png"
  modalMainImage.src = mainImageUrl
  modalMainImage.alt = property.nombre
  modalMainImage.onerror = function () {
    this.src = "/propiedad.png"
  }

  carouselImages = property.urls && Array.isArray(property.urls) ? property.urls : []
  currentCarouselIndex = 0
  renderCarousel()

  modalBuyBtn.onclick = () => handleBuyClick(property.nombre, formattedPrice)

  propertyModal.classList.add("active")
  document.body.style.overflow = "hidden"
}

function renderCarousel() {
  modalCarouselTrack.innerHTML = ""

  if (carouselImages.length === 0) {
    modalCarouselTrack.innerHTML =
      '<div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">No hay imágenes adicionales disponibles</div>'
    carouselPrev.disabled = true
    carouselNext.disabled = true
    return
  }

  carouselImages.forEach((url, index) => {
    const img = document.createElement("img")
    img.src = url
    img.alt = `Imagen ${index + 1}`
    img.className = "modal-carousel-image"
    img.loading = "lazy"
    img.onerror = function () {
      this.src = "/propiedad.png"
    }
    img.addEventListener("click", () => openLightbox(url))
    modalCarouselTrack.appendChild(img)
  })

  initCarouselSwipe()
  updateCarouselButtons()
}

function updateCarouselButtons() {
  if (!modalCarouselContainer) return

  const scrollLeft = modalCarouselContainer.scrollLeft
  const maxScroll = modalCarouselContainer.scrollWidth - modalCarouselContainer.clientWidth

  carouselPrev.disabled = scrollLeft <= 0
  carouselNext.disabled = scrollLeft >= maxScroll - 1
}

carouselPrev.addEventListener("click", () => {
  if (!modalCarouselContainer) return

  const scrollAmount = modalCarouselContainer.clientWidth * 0.8
  modalCarouselContainer.scrollBy({
    left: -scrollAmount,
    behavior: "smooth",
  })
})

carouselNext.addEventListener("click", () => {
  if (!modalCarouselContainer) return

  const scrollAmount = modalCarouselContainer.clientWidth * 0.8
  modalCarouselContainer.scrollBy({
    left: scrollAmount,
    behavior: "smooth",
  })
})

if (modalCarouselContainer) {
  modalCarouselContainer.addEventListener("scroll", () => {
    updateCarouselButtons()
  })
}

function initCarouselSwipe() {
  if (!modalCarouselContainer) return

  let startX = 0
  let scrollLeft = 0
  let isDown = false

  modalCarouselContainer.addEventListener("mousedown", (e) => {
    isDown = true
    modalCarouselContainer.style.cursor = "grabbing"
    startX = e.pageX - modalCarouselContainer.offsetLeft
    scrollLeft = modalCarouselContainer.scrollLeft
  })

  modalCarouselContainer.addEventListener("mouseleave", () => {
    isDown = false
    modalCarouselContainer.style.cursor = "grab"
  })

  modalCarouselContainer.addEventListener("mouseup", () => {
    isDown = false
    modalCarouselContainer.style.cursor = "grab"
  })

  modalCarouselContainer.addEventListener("mousemove", (e) => {
    if (!isDown) return
    e.preventDefault()
    const x = e.pageX - modalCarouselContainer.offsetLeft
    const walk = (x - startX) * 2
    modalCarouselContainer.scrollLeft = scrollLeft - walk
  })

  // Touch events for mobile
  let touchStartX = 0
  let touchScrollLeft = 0

  modalCarouselContainer.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].pageX
      touchScrollLeft = modalCarouselContainer.scrollLeft
    },
    { passive: true },
  )

  modalCarouselContainer.addEventListener(
    "touchmove",
    (e) => {
      const touchX = e.touches[0].pageX
      const walk = (touchStartX - touchX) * 1.5
      modalCarouselContainer.scrollLeft = touchScrollLeft + walk
    },
    { passive: true },
  )
}

function openLightbox(imageUrl) {
  const lightbox = document.createElement("div")
  lightbox.className = "lightbox"
  lightbox.innerHTML = `
    <div class="lightbox-overlay"></div>
    <div class="lightbox-content">
      <button class="lightbox-close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <img src="${imageUrl}" alt="Imagen ampliada" class="lightbox-image">
    </div>
  `

  document.body.appendChild(lightbox)
  const originalOverflow = document.body.style.overflow
  document.body.style.overflow = "hidden"

  // Trigger animation
  setTimeout(() => {
    lightbox.classList.add("active")
  }, 10)

  // Close handlers
  const closeLightbox = () => {
    lightbox.classList.remove("active")
    setTimeout(() => {
      if (document.body.contains(lightbox)) {
        document.body.removeChild(lightbox)
      }
      if (!propertyModal.classList.contains("active")) {
        document.body.style.overflow = originalOverflow
      }
      document.removeEventListener("keydown", handleEscape)
    }, 300)
  }

  const closeBtn = lightbox.querySelector(".lightbox-close")
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    closeLightbox()
  })

  const overlay = lightbox.querySelector(".lightbox-overlay")
  overlay.addEventListener("click", (e) => {
    e.stopPropagation()
    closeLightbox()
  })

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeLightbox()
    }
  }
  document.addEventListener("keydown", handleEscape)
}

function closePropertyModal() {
  propertyModal.classList.remove("active")
  document.body.style.overflow = ""
}

modalClose.addEventListener("click", closePropertyModal)
modalOverlay.addEventListener("click", closePropertyModal)

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && propertyModal.classList.contains("active")) {
    closePropertyModal()
  }
})

function filterProperties(properties, searchTerm) {
  if (!searchTerm || searchTerm.trim() === "") {
    return properties
  }

  const term = searchTerm.toLowerCase().trim()

  return properties.filter((property) => {
    const nombre = (property.nombre || "").toLowerCase()
    const descripcion = (property.descripcion || "").toLowerCase()
    const category = (property.category || "").toLowerCase()

    return nombre.includes(term) || descripcion.includes(term) || category.includes(term)
  })
}

function updateSearchResults() {
  const filteredProperties = filterProperties(allProperties, currentSearchTerm)

  propertiesGrid.innerHTML = ""

  if (filteredProperties.length === 0) {
    const message = currentSearchTerm
      ? `No se encontraron propiedades que coincidan con "${currentSearchTerm}"`
      : "No hay propiedades disponibles en esta categoría."
    propertiesGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-muted);">${message}</div>`
    return
  }

  filteredProperties.forEach((property, index) => {
    const card = createPropertyCard(property)
    propertiesGrid.appendChild(card)

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

// === Redirección al Discord ===
// TIP: si vas a invitar gente, usa un enlace de invitación (p. ej. https://discord.gg/xxxx)
// El enlace /channels funciona solo para usuarios que ya están dentro del servidor.
function handleBuyClick(title, price) {
  console.log("[v0] Buy button clicked:", title, price)

  // Misma pestaña:
  // window.location.href = "https://discord.com/channels/1251620966673420380/1251620968179302482";

  // Si prefieres nueva pestaña, usa:
  window.open("https://discord.com/channels/1251620966673420380/1251620968179302482", "_blank")
}

// Initial render
renderProperties(currentCategory)

// Close sidebar on mobile when clicking outside
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768) {
    if (!sidebar.contains(e.target) && !openSidebarBtn.contains(e.target)) {
      sidebar.classList.add("hidden")
      mainContent.classList.add("expanded")
    }
  }
})

// --- PATCH: forzar navegación del link Home ---
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

let currentCarouselIndex = 0
let carouselImages = []

let resizeTimeout
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    if (propertyModal.classList.contains("active")) {
      updateCarouselButtons()
    }
  }, 150)
})

const style = document.createElement("style")
style.textContent = `
  @keyframes ripple {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`
document.head.appendChild(style)

function getStatusInfo(estadoId) {
  const estados = {
    1: { codigo: "Alquilado", nombre: "Alquilado", class: "status-alquilado" },
    2: { codigo: "Disponible", nombre: "Disponible", class: "status-disponible" },
    3: { codigo: "Sin stock", nombre: "Sin stock", class: "status-sinstock" },
    
  }

  // Default to activo if estado_id is not provided or invalid
  return estados[estadoId] || estados[2]
}
