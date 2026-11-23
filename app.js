const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

// ===== Botón para volver arriba =====
const arriba = $('#btnVolverArriba');
addEventListener('scroll', () => arriba.classList.toggle('mostrar', scrollY > 300), { passive: true });
arriba.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

// ===== Cursor mágico con brillitos (idea original de las alumnas) =====
const colores = ['#2DE2E6', '#FF5CA8', '#8A6BFF', '#FFFFFF'];
let ultimo = 0;
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.addEventListener('mousemove', (e) => {
    const ahora = Date.now();
    if (ahora - ultimo < 35) return;
    ultimo = ahora;
    const b = document.createElement('span');
    const t = Math.random() * 8 + 4;
    b.className = 'brillo-magico';
    b.style.cssText = `left:${e.pageX}px;top:${e.pageY}px;width:${t}px;height:${t}px;background:${colores[Math.floor(Math.random() * colores.length)]}`;
    b.style.setProperty('--x', (Math.random() - 0.5) * 40 + 'px');
    b.style.setProperty('--y', (Math.random() - 0.5) * 40 - 15 + 'px');
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 700);
  });
}

// ===== Luz que sigue al cursor en los chips de tecnologías =====
$$('.ch').forEach((c) => c.addEventListener('mousemove', (e) => {
  const r = c.getBoundingClientRect();
  c.style.setProperty('--mx', e.clientX - r.left + 'px');
  c.style.setProperty('--my', e.clientY - r.top + 'px');
}));

// ===== Galería de capturas (apps que no tienen link público) =====
const galeria = $('#galeria');
if (galeria) {
  const img = $('#g-img');
  const contador = $('#g-n');
  const titulo = $('#g-tit');
  let fotos = [];
  let actual = 0;

  const mostrar = () => {
    img.src = fotos[actual];
    contador.textContent = `${actual + 1} / ${fotos.length}`;
  };
  const mover = (d) => {
    actual = (actual + d + fotos.length) % fotos.length;
    mostrar();
  };

  $$('[data-imgs]').forEach((b) => b.onclick = () => {
    fotos = b.dataset.imgs.split(',');
    actual = Number(b.dataset.inicio) || 0;
    titulo.textContent = b.dataset.titulo;
    img.alt = b.dataset.titulo;
    mostrar();
    galeria.showModal();
  });

  $('#g-prev').onclick = () => mover(-1);
  $('#g-next').onclick = () => mover(1);
  $('#g-x').onclick = () => galeria.close();
  galeria.addEventListener('click', (e) => { if (e.target === galeria) galeria.close(); });
  galeria.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mover(-1);
    if (e.key === 'ArrowRight') mover(1);
  });
}
// ===== Menú desplegable (celular) =====
const menuBtn = $('#menuBtn');
const menu = $('#menu');
if (menuBtn && menu) {
  const alternar = (abrir) => {
    menu.classList.toggle('abierto', abrir);
    menuBtn.setAttribute('aria-expanded', abrir);
    menuBtn.textContent = abrir ? '✕' : '☰';
  };
  menuBtn.onclick = () => alternar(!menu.classList.contains('abierto'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) alternar(false); });
}

// ===== Números del inicio: se cuentan solos desde la página y suben animados =====
const totales = {
  juegos: $$('[data-tipo="juego"]').length,
  apps: $$('[data-tipo="app"]').length,
  tecnologias: $$('.ch').length,
  equipos: $$('.grid-noticias .card').length,
};
const sinAnimar = matchMedia('(prefers-reduced-motion: reduce)').matches;
$$('[data-cuenta]').forEach((el) => {
  const meta = totales[el.dataset.cuenta];
  if (!meta) return;                       // si no encuentra nada, deja el número que está escrito
  if (sinAnimar) { el.textContent = meta; return; }
  el.textContent = '0';
  const inicio = performance.now();
  const duracion = 1400;
  const paso = (t) => {
    const p = Math.min((t - inicio) / duracion, 1);
    el.textContent = Math.round(meta * (1 - Math.pow(1 - p, 3)));   // arranca rápido y frena al final
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
});

// ===== Video de la mascota: si la persona pidió menos movimiento, queda en pausa con controles =====
const videoMascota = $('.mascota-vis video');
if (videoMascota && matchMedia('(prefers-reduced-motion: reduce)').matches) {
  videoMascota.removeAttribute('autoplay');
  videoMascota.pause();
  videoMascota.controls = true;
}

// ===== Carrusel "Así trabajamos" (fotos verticales) =====
const carrusel = $('#carrusel');
if (carrusel) {
  const pista = carrusel.querySelector('.c-pista');
  const puntos = carrusel.querySelector('.c-dots');
  const prev = carrusel.querySelector('.c-prev');
  const next = carrusel.querySelector('.c-next');

  const fotos = () => [...pista.children];
  const paso = () => {                                   // cuánto mide avanzar una foto
    const f = fotos();
    return f.length > 1 ? f[1].offsetLeft - f[0].offsetLeft : pista.clientWidth;
  };
  const posiciones = () => Math.round((pista.scrollWidth - pista.clientWidth) / paso()) + 1;
  const actual = () => Math.min(Math.round(pista.scrollLeft / paso()), posiciones() - 1);
  const ir = (i) => {
    const n = posiciones();
    pista.scrollTo({ left: ((i + n) % n) * paso(), behavior: 'smooth' });
  };
  const marcar = () => [...puntos.children].forEach((p, i) => {
    p.classList.toggle('on', i === actual());
    p.setAttribute('aria-current', i === actual());
  });
  const armar = () => {                                  // los puntitos dependen de cuántas fotos entran en pantalla
    const n = posiciones();
    puntos.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const p = document.createElement('button');
      p.type = 'button';
      p.setAttribute('aria-label', `Ir a la posición ${i + 1}`);
      p.onclick = () => ir(i);
      puntos.appendChild(p);
    }
    prev.hidden = next.hidden = puntos.hidden = n < 2;
    marcar();
  };

  // si la imagen todavía no existe, queda el cuadro de color con 📸
  const sinFoto = (fig) => fig.classList.add('sin-foto');
  fotos().forEach((fig) => {
    const im = fig.querySelector('img');
    im.addEventListener('error', () => sinFoto(fig));
    if (im.complete && !im.naturalWidth) sinFoto(fig);
  });

  pista.addEventListener('scroll', marcar, { passive: true });
  addEventListener('resize', armar);
  prev.onclick = () => ir(actual() - 1);
  next.onclick = () => ir(actual() + 1);
  pista.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual() - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual() + 1); }
  });
  addEventListener('load', armar);
  armar();
}
