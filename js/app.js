import { AYAR, waLink } from './config.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* gizli sekme */ } },
};

// ---------- Meta Pixel (sadece onayla) ----------
let pixelOn = false;
function loadPixel() {
  if (!AYAR.metaPixel || pixelOn) return;
  pixelOn = true;
  /* eslint-disable */
  !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', AYAR.metaPixel); window.fbq('track', 'PageView');
}
function track(ev, data) { if (pixelOn && window.fbq) window.fbq('track', ev, data); }
if (AYAR.metaPixel) {
  const c = store.get('wis_onay');
  if (c === 'evet') loadPixel();
  else if (c !== 'hayir') {
    const box = $('.consent'); box?.classList.add('show');
    box?.querySelector('[data-ok]')?.addEventListener('click', () => { store.set('wis_onay', 'evet'); box.classList.remove('show'); loadPixel(); });
    box?.querySelector('[data-no]')?.addEventListener('click', () => { store.set('wis_onay', 'hayir'); box.classList.remove('show'); });
  }
}

// ---------- WhatsApp bağlantıları ----------
const MSG = {
  genel: 'Merhaba Web ile Sat 👋 Web sitesi hakkında bilgi almak istiyorum.',
  teklif: 'Merhaba Web ile Sat 👋 İşletmem için web sitesi teklifi almak istiyorum.\nSektörüm: \nŞehrim: ',
  hediye: 'Merhaba 👋 Web sitesi + hediye reklam videosu (Vitrin + Reklam paketi) hakkında bilgi almak istiyorum.',
  demo: 'Merhaba 👋 Sitenizdeki 3D modeli gördüm. İşletmem için 3D modelli bir site istiyorum.',
  ornek: 'Merhaba 👋 Örnek işlerinizi gördüm, benzer bir site istiyorum.',
};
// reklam kaynağı: ?utm_content=... ya da ?s=... mesajın sonuna eklenir (hangi reklam sipariş getirdi)
const REF = (() => { try { const q = new URLSearchParams(location.search); return (q.get('utm_content') || q.get('s') || '').replace(/[^\w\-çğıöşüÇĞİÖŞÜ]/g, '').slice(0, 40); } catch (e) { return ''; } })();
const refTag = () => (REF ? `\n(ref: ${REF})` : '');
function waFor(el) { return waBase(el) + refTag(); }
function waBase(el) {
  const k = el.dataset.wa;
  if (k === 'paket') return `Merhaba Web ile Sat 👋 *${el.dataset.paket}* paketini (${el.dataset.fiyat}) almak istiyorum.\nSektörüm: \nŞehrim: `;
  if (k === 'demo' && el.dataset.extra) return `Merhaba 👋 Sitenizdeki 3D modeli gördüm. ${el.dataset.extra} istiyorum.`;
  if (k === 'ornek' && el.dataset.site) return `Merhaba 👋 ${el.dataset.site} sitesini gördüm, işletmem için benzer bir site istiyorum.`;
  return MSG[k] || MSG.genel;
}
$$('[data-wa]').forEach((el) => {
  el.setAttribute('href', waLink(waFor(el)));
  el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener');
  el.addEventListener('click', () => {
    el.setAttribute('href', waLink(waFor(el))); // demo seçimi değişmiş olabilir
    track(el.dataset.wa === 'paket' ? 'Lead' : 'Contact', el.dataset.paket ? { content_name: el.dataset.paket } : undefined);
  });
});
$$('[data-tel]').forEach((el) => { el.textContent = AYAR.telefonGorunen; el.href = 'tel:+' + AYAR.whatsapp; });
$$('[data-ig]').forEach((el) => { el.href = `https://www.instagram.com/${AYAR.instagram}/`; });

// ---------- menü / alt çubuk ----------
const nav = $('.nav'), mbar = $('.mbar'), heroEl = $('.hero');
function onScroll() {
  const y = scrollY;
  nav.classList.toggle('scrolled', y > 20);
  const h = heroEl ? heroEl.offsetHeight * 0.6 : 400;
  mbar?.classList.toggle('show', y > h && !$('.consent.show'));
  $('.wa-float')?.classList.toggle('show', y > h);
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// ---------- görünme animasyonu ----------
const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.rv').forEach((el) => rio.observe(el));

// ---------- sayaçlar ----------
const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return; cio.unobserve(e.target);
  const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suf || '', pre = el.dataset.pre || '';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const t0 = performance.now(), D = 1400;
  (function step(n) {
    const p = Math.min(1, (n - t0) / D), v = to * (1 - Math.pow(1 - p, 3));
    el.textContent = pre + v.toFixed(dec).replace('.', ',') + suf;
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}), { threshold: .6 });
$$('[data-count]').forEach((el) => cio.observe(el));

// ---------- videolar: görünürken oynat ----------
const vio = new IntersectionObserver((es) => es.forEach((e) => {
  const v = e.target;
  if (e.isIntersecting) {
    if (!v.dataset.ready) { $$('source[data-src]', v).forEach((s) => { s.src = s.dataset.src; }); v.load(); v.dataset.ready = 1; }
    v.play().catch(() => {});
  } else v.pause();
}), { threshold: .25 });
$$('video[data-lazy]').forEach((v) => vio.observe(v));
// tanıtım videoları: veri harcamasın diye yalnızca dokununca iner, sesli oynar; aynı anda tek video
$$('.sound-btn').forEach((b) => {
  const v = b.parentElement.querySelector('video');
  b.addEventListener('click', () => {
    if (!v.dataset.ready) { $$('source[data-src]', v).forEach((s) => { s.src = s.dataset.src; }); v.load(); v.dataset.ready = 1; }
    const play = v.paused || v.muted;
    $$('.sound-btn').forEach((o) => { if (o !== b) { const ov = o.parentElement.querySelector('video'); ov.pause(); o.innerHTML = '▶ Sesli izle'; } });
    if (play) { v.muted = false; v.play().catch(() => {}); b.innerHTML = '❚❚ Durdur'; }
    else { v.pause(); b.innerHTML = '▶ Sesli izle'; }
  });
  v.addEventListener('ended', () => { b.innerHTML = '▶ Sesli izle'; });
});
const tio = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting && !e.target.paused) { e.target.pause(); const b = e.target.parentElement.querySelector('.sound-btn'); if (b) b.innerHTML = '▶ Sesli izle'; } }), { threshold: 0 });
$$('video[data-tap]').forEach((v) => tio.observe(v));


// ---------- indirim çarkı ----------
(function wheel() {
  const cv = $('#wheel'); if (!cv) return;
  const hub = $('#wheelSpin'), out = $('.prize'), outName = $('#prizeName'), outBtn = $('#prizeWa'), outInfo = $('#prizeInfo');
  const P = AYAR.cark, n = P.length, seg = (Math.PI * 2) / n, GUN = 30 * 864e5;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = 1000, ctx = cv.getContext('2d'); cv.width = cv.height = S;
  let ang = 0;
  const colors = [['#13315c', '#0b2545'], ['#ffffff', '#eef2f8']];
  function draw() {
    ctx.clearRect(0, 0, S, S);
    ctx.save(); ctx.translate(S / 2, S / 2);
    ctx.beginPath(); ctx.arc(0, 0, 492, 0, Math.PI * 2);
    const rg = ctx.createLinearGradient(-500, -500, 500, 500); rg.addColorStop(0, '#d6dce6'); rg.addColorStop(.5, '#9aa6b8'); rg.addColorStop(1, '#d6dce6');
    ctx.fillStyle = rg; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 462, 0, Math.PI * 2); ctx.fillStyle = '#0b2545'; ctx.fill();
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 - seg / 2 + i * seg + ang;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 452, a0, a0 + seg); ctx.closePath();
      const c = colors[i % 2], g = ctx.createRadialGradient(0, 0, 60, 0, 0, 452); g.addColorStop(0, c[0]); g.addColorStop(1, c[1]);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(11,37,69,.18)'; ctx.lineWidth = 3; ctx.stroke();
      // yazı: sol yarıda ters durmasın diye 180° çevrilir
      const mid = a0 + seg / 2, left = Math.cos(mid) < 0;
      ctx.save(); ctx.rotate(mid); if (left) ctx.rotate(Math.PI);
      ctx.textAlign = left ? 'left' : 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = i % 2 ? '#0b2545' : '#ffffff';
      ctx.font = '800 44px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(P[i].kisa, left ? -375 : 375, 0);
      ctx.restore();
    }
    const tick = reduce ? 0 : Math.floor(performance.now() / 300);
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2, on = (tick + i) % 2;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 477, Math.sin(a) * 477, 8, 0, Math.PI * 2);
      ctx.fillStyle = on ? '#ffffff' : '#5b6b84'; ctx.fill();
    }
    ctx.restore();
  }
  // ampuller yalnızca çark görünürken yanıp söner
  let idle = true, vis = false;
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; }).observe(cv);
  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (idle) draw(); });
  if (!reduce) setInterval(() => { if (idle && vis && !document.hidden) draw(); }, 300);
  function pick() {
    const tot = P.reduce((s, p) => s + p.agirlik, 0); let r = Math.random() * tot;
    for (let i = 0; i < n; i++) { r -= P[i].agirlik; if (r <= 0) return i; }
    return 0;
  }
  function kod(i, t) { return 'WIS-' + (i + 1) + '-' + (Math.floor(t / 1000) % 1679616).toString(36).toUpperCase().padStart(4, '0'); }
  function showPrize(i, t) {
    const p = P[i], son = new Date(t + GUN).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    outName.textContent = p.ad;
    outInfo.textContent = `Son kullanım: ${son}. WhatsApp'tan yazın, siparişinize ekleyelim.`;
    outBtn.href = waLink(`Merhaba Web ile Sat 👋 Sitenizdeki çarkta *${p.ad}* kazandım 🎁\nKod: ${kod(i, t)} · Son kullanım: ${son}\nWeb sitesi paketleri hakkında bilgi almak istiyorum.` + refTag());
    out.classList.add('show'); hub.disabled = true; hub.textContent = 'Kazandınız!';
  }
  const prev = store.get('wis_cark');
  if (prev && P[prev.i] && prev.t && Date.now() - prev.t < GUN) { ang = -prev.i * seg; draw(); showPrize(prev.i, prev.t); }
  hub.addEventListener('click', () => {
    if (hub.disabled) return;
    hub.disabled = true; idle = false;
    const i = pick();
    const turns = 6 + Math.floor(Math.random() * 2);
    const target = turns * Math.PI * 2 - i * seg + (Math.random() - .5) * seg * 0.6;
    const start = ang % (Math.PI * 2), t0 = performance.now(), D = reduce ? 600 : 5200;
    (function spin(now) {
      const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 4);
      ang = start + (target - start) * e; draw();
      if (p < 1) requestAnimationFrame(spin);
      else {
        idle = true; const t = Date.now(); store.set('wis_cark', { i, t }); showPrize(i, t);
        track('Lead', { content_name: 'Çark: ' + P[i].ad });
        if (innerWidth < 960) setTimeout(() => out.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }), 300);
      }
    })(t0);
  });
})();

// yıl
$$('[data-yil]').forEach((el) => { el.textContent = new Date().getFullYear(); });
