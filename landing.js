// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Add parallax effect to background
let ticking = false

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      const scrolled = window.pageYOffset
      const heroBackground = document.querySelector(".hero-background")
      if (heroBackground) {
        heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`
      }
      ticking = false
    })
    ticking = true
  }
})

// Button hover sound effect (optional - can be removed)
const buttons = document.querySelectorAll(".hero-button")
buttons.forEach((button) => {
  button.addEventListener("mouseenter", () => {
    button.style.transform = "translateY(-5px)"
  })

  button.addEventListener("mouseleave", () => {
    button.style.transform = "translateY(0)"
  })
})

// Add loading animation
window.addEventListener("load", () => {
  document.body.style.opacity = "0"
  requestAnimationFrame(() => {
    document.body.style.transition = "opacity 0.5s ease"
    document.body.style.opacity = "1"
  })
})
