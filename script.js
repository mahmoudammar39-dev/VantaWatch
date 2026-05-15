const root = document.documentElement;
const body = document.body;
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".primary-nav a");
const watchRender = document.querySelector("[data-watch-render]");
const motionToggle = document.querySelector("[data-motion-toggle]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let pointerX = 0;
let pointerY = 0;
let currentX = 0;
let currentY = 0;
let frameId = 0;
let serialStarted = false;

function setHeaderState() {
  header.classList.toggle("scrolled", window.scrollY > 24);
  root.style.setProperty("--scroll", String(window.scrollY));
  updateParallax();
}

navToggle.addEventListener("click", () => {
  const isOpen = body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !body.classList.contains("nav-open")) return;
  body.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.focus();
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

function updatePointer(event) {
  const x = event.clientX / window.innerWidth;
  const y = event.clientY / window.innerHeight;

  pointerX = (x - 0.5) * 2;
  pointerY = (y - 0.5) * 2;
  root.style.setProperty("--mx", `${Math.round(x * 100)}%`);
  root.style.setProperty("--my", `${Math.round(y * 100)}%`);
}

window.addEventListener("pointermove", updatePointer, { passive: true });

function animateWatch(time = 0) {
  if (!body.classList.contains("motion-paused")) {
    currentX += (pointerX - currentX) * 0.035;
    currentY += (pointerY - currentY) * 0.035;

    const idleY = Math.sin(time / 5200) * 4.2;
    const idleX = Math.cos(time / 6800) * 1.4;
    const rotateY = idleY + currentX * 9;
    const rotateX = idleX - currentY * 5;
    const lift = Math.sin(time / 4200) * 10;

    watchRender.style.transform = `translate3d(0, ${lift}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  frameId = window.requestAnimationFrame(animateWatch);
}

function setMotionPaused(paused) {
  body.classList.toggle("motion-paused", paused);
  motionToggle.setAttribute("aria-pressed", String(paused));
  motionToggle.textContent = paused ? "Start motion" : "Pause motion";
}

setMotionPaused(reduceMotion.matches);
motionToggle.addEventListener("click", () => {
  setMotionPaused(!body.classList.contains("motion-paused"));
});

if (!reduceMotion.matches) {
  animateWatch();
}

reduceMotion.addEventListener("change", () => {
  window.cancelAnimationFrame(frameId);
  setMotionPaused(reduceMotion.matches);
  if (!reduceMotion.matches) animateWatch();
});

const revealItems = document.querySelectorAll("[data-reveal]");
const parallaxLayers = document.querySelectorAll(".parallax-layer");

function updateParallax() {
  parallaxLayers.forEach((layer) => {
    const depth = Number(layer.dataset.depth || 0);
    const rect = layer.getBoundingClientRect();
    const movement = rect.top * depth;
    layer.style.transform = `translate3d(0, ${movement}px, 0)`;
  });
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

window.setTimeout(() => {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}, 350);

const serialSection = document.querySelector("[data-serial]");
const serialCurrent = document.querySelector("[data-serial-current]");

function runSerial() {
  if (serialStarted) return;
  serialStarted = true;

  const start = performance.now();
  const duration = 1600;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const rolling = Math.floor((now - start) / 28) % 100;
    const value = progress < 0.84 ? rolling : 1;
    serialCurrent.textContent = String(value).padStart(3, "0");

    if (progress < 1) window.requestAnimationFrame(step);
  }

  window.requestAnimationFrame(step);
}

if ("IntersectionObserver" in window) {
  const serialObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runSerial();
        serialObserver.disconnect();
      });
    },
    { threshold: 0.35 }
  );

  serialObserver.observe(serialSection);
} else {
  runSerial();
}

const reserveForm = document.querySelector(".reserve-form");
const formStatus = reserveForm.querySelector(".form-status");

reserveForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const fields = Array.from(reserveForm.querySelectorAll("input, select"));
  let firstInvalid = null;

  fields.forEach((field) => {
    const valid = field.checkValidity();
    field.setAttribute("aria-invalid", String(!valid));
    if (!valid && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) {
    formStatus.textContent = "Please complete the highlighted fields.";
    firstInvalid.focus();
    return;
  }

  const name = reserveForm.elements.name.value.trim();
  const interest = reserveForm.elements.interest.value;
  formStatus.textContent = `Thank you, ${name}. Your ${interest.toLowerCase()} request is ready for follow-up.`;
  reserveForm.reset();
  fields.forEach((field) => field.setAttribute("aria-invalid", "false"));
});

const canvas = document.querySelector("[data-particles]");
const context = canvas.getContext("2d");
let particles = [];
let particleFrame = 0;

function resizeParticles() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * ratio);
  canvas.height = Math.floor(canvas.clientHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(180, Math.floor(canvas.clientWidth / 7));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.clientWidth,
    y: Math.random() * canvas.clientHeight,
    size: Math.random() * 1.8 + 0.25,
    alpha: Math.random() * 0.55 + 0.12,
    speed: Math.random() * 0.18 + 0.035,
    drift: Math.random() * 0.1 - 0.05
  }));
}

function drawParticles() {
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  particles.forEach((particle) => {
    particle.y += particle.speed;
    particle.x += particle.drift;

    if (particle.y > canvas.clientHeight + 4) particle.y = -4;
    if (particle.x < -4) particle.x = canvas.clientWidth + 4;
    if (particle.x > canvas.clientWidth + 4) particle.x = -4;

    context.beginPath();
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fillStyle = `rgba(247, 241, 232, ${particle.alpha})`;
    context.fill();
  });

  particleFrame = window.requestAnimationFrame(drawParticles);
}

resizeParticles();
window.addEventListener("resize", resizeParticles);

if (!reduceMotion.matches) {
  drawParticles();
}

reduceMotion.addEventListener("change", () => {
  window.cancelAnimationFrame(particleFrame);
  if (!reduceMotion.matches) drawParticles();
});
