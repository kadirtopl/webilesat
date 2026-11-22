// Hero 3D sahne: dizüstü + 2 telefon (gerçek müşteri siteleri ekranda), altın "W" ok, bildirim kartları, altın toz.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const canvas = document.getElementById('hero3d');
const hero = document.querySelector('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth < 860;

function rrectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// köşeleri yuvarlak ekran düzlemi (UV 0..1)
function screenGeo(w, h, r) {
  const g = new THREE.ShapeGeometry(rrectShape(w, h, r), 12);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + .5, p.getY(i) / h + .5);
  return g;
}

function videoTex(src, poster) {
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
  v.preload = 'auto'; v.crossOrigin = 'anonymous';
  src.forEach(([u, t]) => { const s = document.createElement('source'); s.src = u; s.type = t; v.appendChild(s); });
  const t = new THREE.VideoTexture(v); t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  // video oynayana kadar poster
  const ph = new THREE.TextureLoader().load(poster, (x) => { x.colorSpace = THREE.SRGBColorSpace; });
  return { v, t, ph };
}

function imgTex(url, cb) {
  const t = new THREE.TextureLoader().load(url, cb);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function drawIcon(x, kind, cx, cy, R) {
  x.save(); x.translate(cx, cy);
  if (kind === 'wa') {
    x.fillStyle = '#25D366'; x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(0, -2, R * .52, R * .44, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(-R * .3, R * .25); x.lineTo(-R * .42, R * .52); x.lineTo(-R * .05, R * .36); x.fill();
    x.fillStyle = '#25D366'; [-.22, 0, .22].forEach((d) => { x.beginPath(); x.arc(d * R, -2, R * .075, 0, Math.PI * 2); x.fill(); });
  } else if (kind === 'gift') {
    const g = x.createLinearGradient(0, -R, 0, R); g.addColorStop(0, '#FFD884'); g.addColorStop(1, '#D9952A');
    x.fillStyle = g; x.beginPath(); x.roundRect(-R * .62, -R * .2, R * 1.24, R * .82, 8); x.fill();
    x.beginPath(); x.roundRect(-R * .72, -R * .44, R * 1.44, R * .3, 6); x.fill();
    x.fillStyle = '#B3261E'; x.fillRect(-R * .09, -R * .44, R * .18, R * 1.06);
    x.strokeStyle = '#B3261E'; x.lineWidth = R * .12; x.lineCap = 'round';
    x.beginPath(); x.ellipse(-R * .22, -R * .58, R * .22, R * .13, -.5, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.ellipse(R * .22, -R * .58, R * .22, R * .13, .5, 0, Math.PI * 2); x.stroke();
  } else {
    [[1, '#F2B544'], [.68, '#0F1D33'], [.42, '#F2B544'], [.16, '#0F1D33']].forEach(([k, c]) => { x.fillStyle = c; x.beginPath(); x.arc(0, 0, R * k, 0, Math.PI * 2); x.fill(); });
    x.strokeStyle = '#fff'; x.lineWidth = R * .1; x.lineCap = 'round';
    x.beginPath(); x.moveTo(R * .05, -R * .05); x.lineTo(R * .75, -R * .75); x.stroke();
  }
  x.restore();
}

function cardTex(kind, title, sub) {
  const W = 640, H = 200, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.beginPath(); x.roundRect(6, 6, W - 12, H - 12, 44);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(32,52,88,0.96)'); g.addColorStop(1, 'rgba(12,24,44,0.96)');
  x.fillStyle = g; x.fill(); x.lineWidth = 3; x.strokeStyle = 'rgba(242,181,68,0.55)'; x.stroke();
  drawIcon(x, kind, 100, H / 2, 50);
  x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.font = '800 44px "Plus Jakarta Sans", system-ui, sans-serif';
  x.fillText(title, 178, H / 2 - 24);
  x.fillStyle = '#AEB8C9'; x.font = '600 32px "Plus Jakarta Sans", system-ui, sans-serif';
  x.fillText(sub, 178, H / 2 + 30);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function shadowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(.6, 'rgba(0,0,0,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
function dotTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,230,170,1)'); g.addColorStop(.25, 'rgba(242,181,68,.8)'); g.addColorStop(1, 'rgba(242,181,68,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function startHero() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return false; }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 1.25, 11);

  // ışıklar
  scene.add(new THREE.HemisphereLight(0x9fb6e0, 0x0a1424, 0.6));
  const key = new THREE.DirectionalLight(0xffe2b0, 1.4); key.position.set(4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f9cff, 1.1); rim.position.set(-6, 3, -4); scene.add(rim);
  const goldPt = new THREE.PointLight(0xf2b544, 6, 9, 2); goldPt.position.set(0.4, 0.6, -1.2); scene.add(goldPt);

  const root = new THREE.Group(); scene.add(root);
  const rig = new THREE.Group(); root.add(rig);

  // malzemeler
  const alu = new THREE.MeshPhysicalMaterial({ color: 0x2b3448, metalness: .9, roughness: .3, clearcoat: .4, clearcoatRoughness: .25 });
  const aluLight = new THREE.MeshPhysicalMaterial({ color: 0x3a465e, metalness: .85, roughness: .38 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x05070c, metalness: .2, roughness: .25, clearcoat: 1 });
  const goldTi = new THREE.MeshPhysicalMaterial({ color: 0xd9b46c, metalness: 1, roughness: .26, clearcoat: .6 });
  const navyTi = new THREE.MeshPhysicalMaterial({ color: 0x223452, metalness: 1, roughness: .3, clearcoat: .6 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .05, transparent: true, opacity: .12, clearcoat: 1 });

  // ---------- dizüstü ----------
  const laptop = new THREE.Group();
  const LW = 3.6, LD = 2.4;
  const base = new THREE.Mesh(new RoundedBoxGeometry(LW, 0.12, LD, 4, 0.06), alu);
  base.position.y = 0.06; laptop.add(base);
  const deck = new THREE.Mesh(new RoundedBoxGeometry(LW - .36, 0.02, 1.05, 2, 0.01), new THREE.MeshStandardMaterial({ color: 0x0b0f18, roughness: .7 }));
  deck.position.set(0, 0.125, -0.42); laptop.add(deck);
  // tuş dokusu
  { const c = document.createElement('canvas'); c.width = 1024; c.height = 320; const x = c.getContext('2d');
    x.fillStyle = '#0b0f18'; x.fillRect(0, 0, 1024, 320);
    for (let r = 0; r < 5; r++) for (let k = 0; k < 14; k++) { x.fillStyle = '#161c29'; x.beginPath(); x.roundRect(14 + k * 71.5, 14 + r * 60, 62, 50, 8); x.fill(); }
    const tk = new THREE.CanvasTexture(c); tk.colorSpace = THREE.SRGBColorSpace;
    const keys = new THREE.Mesh(new THREE.PlaneGeometry(LW - .44, 0.98), new THREE.MeshStandardMaterial({ map: tk, roughness: .8 }));
    keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.137, -0.42); laptop.add(keys); }
  const pad = new THREE.Mesh(new RoundedBoxGeometry(1.25, 0.01, 0.72, 2, 0.04), aluLight);
  pad.position.set(0, 0.126, 0.62); laptop.add(pad);

  const lidPivot = new THREE.Group(); lidPivot.position.set(0, 0.12, -LD / 2 + 0.04); laptop.add(lidPivot);
  const LH = 2.3;
  const lid = new THREE.Mesh(new RoundedBoxGeometry(LW, LH, 0.07, 4, 0.035), alu);
  lid.position.set(0, LH / 2, -0.035); lidPivot.add(lid);
  const bezel = new THREE.Mesh(screenGeo(LW - 0.06, LH - 0.06, 0.06), black);
  bezel.position.set(0, LH / 2, 0.002); lidPivot.add(bezel);
  const lapMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const lapScreen = new THREE.Mesh(screenGeo(LW - 0.22, LH - 0.26, 0.02), lapMat);
  lapScreen.position.set(0, LH / 2 + 0.02, 0.004); lidPivot.add(lapScreen);
  const lapGlass = new THREE.Mesh(screenGeo(LW - 0.06, LH - 0.06, 0.06), glass);
  lapGlass.position.set(0, LH / 2, 0.008); lidPivot.add(lapGlass);
  laptop.position.set(0.1, -1.05, -0.6);
  laptop.rotation.y = -0.12;
  rig.add(laptop);

  // dizüstü ekranı: 3 müşteri sitesi sırayla
  const lapTex = [
    imgTex('assets/ref/sahinmermer-ekran.jpg'),
    imgTex('assets/ref/deallife-ekran.jpg'),
    imgTex('assets/ref/dugunsepetim-ekran.jpg'),
  ];
  lapMat.map = lapTex[0];
  lapMat.color.set(0x0f1d33);
  let lapReady = false; lapTex[0].onUpdate = () => { lapReady = true; };

  // ---------- telefon ----------
  function makePhone(frameMat, w = 0.98, h = 2.06) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.1, 6, 0.045), frameMat); g.add(body);
    const front = new THREE.Mesh(screenGeo(w - 0.03, h - 0.03, 0.14), black); front.position.z = 0.051; g.add(front);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const scr = new THREE.Mesh(screenGeo(w - 0.09, h - 0.09, 0.115), mat); scr.position.z = 0.053; g.add(scr);
    const gl = new THREE.Mesh(screenGeo(w - 0.03, h - 0.03, 0.14), glass); gl.position.z = 0.06; g.add(gl);
    // arka kamera adası
    const cam = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.36, 0.03, 3, 0.08), frameMat); cam.position.set(-w / 2 + 0.26, h / 2 - 0.26, -0.06); g.add(cam);
    g.userData.mat = mat;
    return g;
  }
  const phoneA = makePhone(goldTi);
  phoneA.position.set(-2.15, -0.05, 0.9); phoneA.rotation.set(0.02, 0.38, 0.04);
  rig.add(phoneA);
  const phoneB = makePhone(navyTi, 0.9, 1.9);
  phoneB.position.set(2.35, -0.25, 0.55); phoneB.rotation.set(0.02, -0.42, -0.05);
  rig.add(phoneB);

  const vidOn = !isMobile() && !(navigator.connection && navigator.connection.saveData);
  const posterTex = (u) => new THREE.TextureLoader().load(u, (x) => { x.colorSpace = THREE.SRGBColorSpace; });
  let vA = null, vB = null;
  if (vidOn) {
    vA = videoTex([['assets/video/loop-k1_giris-195.mp4', 'video/mp4']], 'assets/video/loop-k1_giris-195.jpg');
    vB = videoTex([['assets/video/loop-ds_davetiye.mp4', 'video/mp4']], 'assets/video/loop-ds_davetiye.jpg');
    phoneA.userData.mat.map = vA.ph; phoneB.userData.mat.map = vB.ph;
    const useVideo = (vt, ph) => {
      vt.v.addEventListener('playing', () => { ph.userData.mat.map = vt.t; ph.userData.mat.needsUpdate = true; }, { once: true });
    };
    useVideo(vA, phoneA); useVideo(vB, phoneB);
  } else {
    phoneA.userData.mat.map = posterTex('assets/video/loop-k1_giris-195.jpg');
    phoneB.userData.mat.map = posterTex('assets/video/loop-ds_davetiye.jpg');
  }

  // ---------- altın W ok (logo) ----------
  const wPts = [[-1.25, 0.85], [-0.62, -0.75], [0.0, 0.2], [0.62, -0.75], [1.18, 0.62]].map(([x, y]) => new THREE.Vector3(x, y, 0));
  const path = new THREE.CurvePath();
  // köşeleri yumuşatılmış W: düz segmentler + küçük quad köşe
  const rad = 0.16;
  let prev = wPts[0].clone();
  for (let i = 1; i < wPts.length; i++) {
    const p = wPts[i];
    if (i < wPts.length - 1) {
      const a = p.clone().sub(prev).normalize(), b = wPts[i + 1].clone().sub(p).normalize();
      const p1 = p.clone().addScaledVector(a, -rad), p2 = p.clone().addScaledVector(b, rad);
      path.add(new THREE.LineCurve3(prev, p1)); path.add(new THREE.QuadraticBezierCurve3(p1, p, p2)); prev = p2;
    } else path.add(new THREE.LineCurve3(prev, p));
  }
  const goldM = new THREE.MeshPhysicalMaterial({ color: 0xf2b544, metalness: 1, roughness: .22, clearcoat: 1, emissive: 0x4a3008, emissiveIntensity: .6 });
  const wMesh = new THREE.Mesh(new THREE.TubeGeometry(path, 220, 0.17, 24, false), goldM);
  const capA = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), goldM); capA.position.copy(wPts[0]);
  const dir = wPts[4].clone().sub(wPts[3]).normalize();
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.62, 3, 1), goldM);
  head.position.copy(wPts[4]).addScaledVector(dir, 0.18);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const wGroup = new THREE.Group(); wGroup.add(wMesh, capA, head);
  wGroup.scale.setScalar(0.95); wGroup.position.set(0.15, 2.05, -2.6);
  rig.add(wGroup);

  // ---------- bildirim kartları ----------
  const cards = [
    { t: cardTex('wa', 'Yeni sipariş', "WhatsApp'tan mesaj geldi"), p: [-1.6, 1.8, 1.6], s: 0.92 },
    { t: cardTex('gift', '%10 kazandınız', 'İndirim çarkı'), p: [1.75, 1.6, 1.4], s: 0.85 },
    { t: cardTex('target', 'Reklam yayında', 'Kocaeli · 25–45 yaş'), p: [1.55, -1.62, 1.9], s: 0.85 },
  ].map((d, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6 * d.s, 0.5 * d.s), new THREE.MeshBasicMaterial({ map: d.t, transparent: true, toneMapped: false, depthWrite: false }));
    m.position.set(...d.p); m.userData = { base: d.p[1], ph: i * 1.7 };
    if (isMobile()) m.scale.setScalar(1.3);
    rig.add(m); return m;
  });

  // ---------- gölge + toz ----------
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.4), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.set(0, -1.08, -0.2); rig.add(sh);
  const N = isMobile() ? 140 : 260, pos = new Float32Array(N * 3), spd = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 14; pos[i * 3 + 1] = (Math.random() - .5) * 8; pos[i * 3 + 2] = (Math.random() - .5) * 8 - 1; spd[i] = .05 + Math.random() * .15; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ size: .07, map: dotTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 }));
  scene.add(dust);

  // ---------- yerleşim ----------
  let W = 1, H = 1;
  function layout() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    const mob = isMobile();
    renderer.setPixelRatio(Math.min(devicePixelRatio, mob ? 1.6 : 1.5));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    if (mob) {
      // mobil: sahne metnin altında; tüm cihazlar görünsün
      const fitW = 7.4; // görünmesi gereken genişlik
      const dist = (fitW / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.aspect;
      camera.position.set(0, 1.1, Math.max(10, dist));
      camera.clearViewOffset();
      const textBottom = (document.querySelector('.hero-copy')?.getBoundingClientRect().bottom ?? 0) - r.top;
      const centerY = textBottom + (H - textBottom) * 0.5;
      camera.setViewOffset(W, H, 0, -(centerY - H / 2), W, H);
      root.scale.setScalar(1);
    } else {
      camera.position.set(0, 1.25, 11.5);
      camera.clearViewOffset();
      camera.setViewOffset(W, H, -W * 0.245, 0, W, H); // sahneyi sağa it (metin solda)
      root.scale.setScalar(W < 1180 ? 0.76 : W < 1600 ? 0.84 : 0.95);
    }
    camera.lookAt(0, 0.35, 0);
    camera.updateProjectionMatrix();
  }

  // ---------- etkileşim ----------
  let tx = 0, ty = 0, rx = 0, ry = 0, drag = null, dragY = 0, scrollP = 0;
  const hint = document.querySelector('.drag-hint');
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2;
  }, { passive: true });
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y0: dragY }; hint?.classList.add('hide'); });
  addEventListener('pointerup', () => { drag = null; });
  addEventListener('pointercancel', () => { drag = null; });
  canvas.addEventListener('pointermove', (e) => { if (drag) dragY = drag.y0 + (e.clientX - drag.x) / W * 2.4; });
  addEventListener('scroll', () => {
    const r = hero.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
  }, { passive: true });

  // ---------- döngü ----------
  let visible = true, running = false, t0 = performance.now(), last = t0, lapIdx = 0, lapT = 0;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; tick(); }, { threshold: 0 });
  io.observe(canvas);
  document.addEventListener('visibilitychange', tick);
  const ease = (x) => 1 - Math.pow(1 - x, 4);

  function frame(now) {
    if (!visible || document.hidden) { running = false; vA?.v.pause(); vB?.v.pause(); return; }
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    const intro = reduce ? 1 : Math.min(1, t / 2.2);
    const ie = ease(intro);
    // kapak açılışı
    const lidP = reduce ? 1 : ease(Math.min(1, Math.max(0, (t - 0.25) / 1.6)));
    lidPivot.rotation.x = THREE.MathUtils.lerp(Math.PI / 2 - 0.02, -0.2, lidP);
    rig.scale.setScalar(0.82 + 0.18 * ie);
    rig.position.y = (1 - ie) * -0.6;
    phoneA.position.x = THREE.MathUtils.lerp(-3.4, -2.15, ie); phoneB.position.x = THREE.MathUtils.lerp(3.6, 2.35, ie);
    // fare + sürükleme + kaydırma
    rx += ((reduce ? 0 : -ty * 0.06) - rx) * 0.05;
    ry += (tx * 0.22 + dragY + (reduce ? 0 : Math.sin(t * 0.25) * 0.06) - ry) * 0.06;
    const sp = reduce ? 0 : scrollP;
    root.rotation.set(rx + sp * 0.18, ry - sp * 0.5, 0);
    root.position.y = sp * 1.4;
    if (!reduce) {
      phoneA.position.y = -0.05 + Math.sin(t * 1.1) * 0.06; phoneB.position.y = -0.25 + Math.sin(t * 0.9 + 1) * 0.06;
      wGroup.rotation.y = Math.sin(t * 0.5) * 0.35; wGroup.position.y = 2.05 + Math.sin(t * 0.8) * 0.05;
      cards.forEach((m) => { m.position.y = m.userData.base + Math.sin(t * 1.2 + m.userData.ph) * 0.07; });
      const p = pg.attributes.position.array;
      for (let i = 0; i < N; i++) { p[i * 3 + 1] += spd[i] * dt; if (p[i * 3 + 1] > 4) p[i * 3 + 1] = -4; }
      pg.attributes.position.needsUpdate = true;
    }
    cards.forEach((m) => { m.quaternion.copy(camera.quaternion); });
    // dizüstü ekranı 4 sn'de bir değişir (yumuşak kararma)
    lapT += dt;
    if (lapT > 4.2) { lapT = 0; lapIdx = (lapIdx + 1) % lapTex.length; lapMat.map = lapTex[lapIdx]; lapMat.needsUpdate = true; }
    const fade = lapT < .35 ? lapT / .35 : 1; if (lapReady || lapIdx) lapMat.color.setScalar(0.25 + 0.75 * fade);
    renderer.render(scene, camera);
    if (!shown) { shown = true; const h = document.documentElement; h.classList.add('gl-ok'); h.classList.remove('no-gl'); }
  }
  let shown = false;
  function tick() {
    if (visible && !document.hidden && !running) {
      running = true; last = performance.now();
      vA?.v.play().catch(() => {}); vB?.v.play().catch(() => {});
      requestAnimationFrame(frame);
    }
  }
  let rT, lastW = innerWidth; addEventListener('resize', () => {
    if (isMobile() && innerWidth === lastW) return; // adres çubuğu açılıp kapanınca yeniden boyutlama yok
    lastW = innerWidth; clearTimeout(rT); rT = setTimeout(layout, 80);
  });
  layout();
  if (renderer.compileAsync) renderer.compileAsync(scene, camera).then(tick).catch(tick); else tick();
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); const h = document.documentElement; h.classList.remove('gl-ok'); h.classList.add('no-gl'); });
  canvas.addEventListener('webglcontextrestored', () => { const h = document.documentElement; h.classList.add('gl-ok'); h.classList.remove('no-gl'); });
  return true;
}
