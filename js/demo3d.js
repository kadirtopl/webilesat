// "İşinize özel 3D model" canlı demosu: sektör seç → model değişir, renk seç → malzeme değişir. Parmakla çevrilir.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const SECTORS = {
  guzellik: {
    label: 'Güzellik merkezi · Serum şişesi', note: '<b>Güzellik merkezi</b> sitesinde müşteri ürünü 3D döndürür, rengini seçer, "Bu ürünü istiyorum" der; mesaj WhatsApp\'a hazır düşer.',
    swatches: [['Gül', '#e88aa0'], ['Altın', '#f2c46b'], ['Lavanta', '#b79ce6'], ['Su yeşili', '#7fd6c2']],
  },
  mermer: {
    label: 'Mermer & tezgah · Numune', note: '<b>Mermerci</b> sitesinde müşteri taşı 3D tezgahta görür. Şahin Mermer\'de 139 renk bu şekilde seçiliyor.',
    swatches: [['Calacatta', '#efe9df'], ['Nero', '#1d1d20'], ['Verde', '#24493c'], ['Traverten', '#d8c3a0']],
  },
  kafe: {
    label: 'Kafe & pastane · Fincan', note: '<b>Kafe/pastane</b> sitesinde ürünler canlı görünür; menüden seçen müşteri siparişini WhatsApp\'tan verir.',
    swatches: [['Porselen', '#f4f1ea'], ['Mat siyah', '#24262b'], ['Terrakota', '#c0643f'], ['Mint', '#9fd8c0']],
  },
  emlak: {
    label: 'Emlak & inşaat · Villa maketi', note: '<b>Emlak/inşaat</b> sitesinde proje 3D maket olarak döner; cephe rengini seçen müşteri teklif ister.',
    swatches: [['Beyaz', '#efede8'], ['Antrasit', '#3b4049'], ['Kum', '#d9c7a6'], ['Gece', '#0f1a2e']],
  },
};

function marbleTex(base, vein, vein2, seed = 1) {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  let s = seed * 9301; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  // yumuşak bulut
  for (let i = 0; i < 60; i++) {
    const g = x.createRadialGradient(rnd() * S, rnd() * S, 0, rnd() * S, rnd() * S, 80 + rnd() * 260);
    g.addColorStop(0, vein2); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = .06; x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
  x.globalAlpha = 1;
  // damarlar
  for (let v = 0; v < 9; v++) {
    let px = rnd() * S * 0.3 - 100, py = rnd() * S;
    const w = v < 3 ? 3 + rnd() * 3 : 0.8 + rnd() * 1.4;
    x.strokeStyle = vein; x.globalAlpha = v < 3 ? .85 : .5; x.lineWidth = w; x.lineCap = 'round';
    x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 60; k++) {
      px += 18 + rnd() * 10; py += (rnd() - .5) * 46 + Math.sin(k * .3 + v) * 8;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const MARBLE = {
  Calacatta: ['#efeae2', 'rgba(176,140,82,1)', 'rgba(150,150,160,1)'],
  Nero: ['#17171a', 'rgba(235,235,235,1)', 'rgba(80,80,90,1)'],
  Verde: ['#1f4134', 'rgba(220,232,222,1)', 'rgba(20,60,45,1)'],
  Traverten: ['#d9c6a3', 'rgba(170,140,100,1)', 'rgba(240,225,200,1)'],
};

function labelTex(text, sub) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#f7f1e6'; x.fillRect(0, 0, 1024, 512);
  x.fillStyle = '#1c1c1c'; x.textAlign = 'center';
  x.font = '800 92px "Plus Jakarta Sans", system-ui, sans-serif'; x.fillText(text, 512, 250);
  x.font = '600 40px "Plus Jakarta Sans", system-ui, sans-serif'; x.fillStyle = '#9a7a3c'; x.fillText(sub, 512, 330);
  x.fillRect(412, 370, 200, 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function startDemo(root) {
  const canvas = root.querySelector('#demo3d');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return false; }
  root.querySelector('.demo-load')?.remove();
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 60); cam.position.set(4.6, 3.0, 6.6);
  const key = new THREE.DirectionalLight(0xfff0d6, 1.6); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x86a8ff, .9); rim.position.set(-4, 2, -3); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xbfd0f0, 0x0a1424, .5));

  const ctl = new OrbitControls(cam, canvas);
  ctl.enableDamping = true; ctl.enableZoom = false; ctl.enablePan = false;
  ctl.minPolarAngle = .5; ctl.maxPolarAngle = 1.45; ctl.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches; ctl.autoRotateSpeed = 1.2;
  ctl.target.set(0, .95, 0);
  ctl.addEventListener('start', () => { ctl.autoRotate = false; root.querySelector('.demo-hint')?.remove(); });

  // zemin: parlak podyum
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.1, .18, 96), new THREE.MeshPhysicalMaterial({ color: 0x0f1d33, metalness: .4, roughness: .25, clearcoat: 1 }));
  podium.position.y = -.09; scene.add(podium);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.01, .022, 12, 160), new THREE.MeshPhysicalMaterial({ color: 0xf2b544, metalness: 1, roughness: .25, emissive: 0x6a4a10, emissiveIntensity: .7 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0; scene.add(ring);

  const holder = new THREE.Group(); scene.add(holder);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xe2bd72, metalness: 1, roughness: .2, clearcoat: 1 });

  // ---------- modeller ----------
  function serum() {
    const g = new THREE.Group();
    const prof = [[0, 0], [.62, 0], [.7, .05], [.72, .2], [.72, 1.55], [.66, 1.72], [.42, 1.86], [.3, 1.92], [.3, 2.05], [0, 2.05]].map(([a, b]) => new THREE.Vector2(a, b));
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .04, transmission: 1, thickness: .6, ior: 1.5, transparent: true });
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), glassM); g.add(body);
    const liq = new THREE.Mesh(new THREE.LatheGeometry([[0, .06], [.64, .06], [.66, .2], [.66, 1.3], [0, 1.3]].map(([a, b]) => new THREE.Vector2(a, b)), 96),
      new THREE.MeshPhysicalMaterial({ color: 0xe88aa0, roughness: .15, transmission: .55, thickness: 1, transparent: true }));
    g.add(liq);
    const label = new THREE.Mesh(new THREE.CylinderGeometry(.735, .735, .72, 96, 1, true, -Math.PI / 2.6, Math.PI / 1.3),
      new THREE.MeshStandardMaterial({ map: labelTex('GLOW', 'SERUM · 30 ml'), roughness: .6, side: THREE.DoubleSide }));
    label.position.y = .78; label.rotation.y = .6; g.add(label);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .38, 64), gold); collar.position.y = 2.2; g.add(collar);
    const bulb = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.3, 0], [.33, .2], [.3, .55], [.18, .72], [0, .75]].map(([a, b]) => new THREE.Vector2(a, b)), 64),
      new THREE.MeshPhysicalMaterial({ color: 0x111114, roughness: .5, clearcoat: .4 }));
    bulb.position.y = 2.38; g.add(bulb);
    g.userData.set = (hex) => liq.material.color.set(hex);
    g.scale.setScalar(1.12);
    return g;
  }
  function mermer() {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ roughness: .12, clearcoat: 1, clearcoatRoughness: .08 });
    const slab = new THREE.Mesh(new RoundedBoxGeometry(3.2, .16, 1.7, 4, .03), mat); slab.position.y = 1.02; g.add(slab);
    const back = new THREE.Mesh(new RoundedBoxGeometry(3.2, 1.1, .08, 4, .02), mat); back.position.set(0, 1.65, -.81); g.add(back);
    const wood = new THREE.MeshPhysicalMaterial({ color: 0x3a2a1e, roughness: .45, clearcoat: .3 });
    const cab = new THREE.Mesh(new RoundedBoxGeometry(3.05, .94, 1.5, 3, .02), wood); cab.position.set(0, .47, 0); g.add(cab);
    [-1.02, 0, 1.02].forEach((x) => { const h = new THREE.Mesh(new RoundedBoxGeometry(.42, .03, .03, 2, .012), gold); h.position.set(x, .78, .76); g.add(h); });
    // musluk
    const faucet = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.045, .055, .55, 24), gold); stem.position.y = .28; faucet.add(stem);
    const arc = new THREE.Mesh(new THREE.TorusGeometry(.2, .04, 16, 48, Math.PI), gold); arc.position.set(.2, .55, 0); faucet.add(arc);
    faucet.position.set(.65, 1.1, -.45); faucet.rotation.y = -Math.PI / 2; g.add(faucet);
    const sink = new THREE.Mesh(new RoundedBoxGeometry(.9, .02, .55, 3, .08), new THREE.MeshPhysicalMaterial({ color: 0x0b0b0d, roughness: .3 })); sink.position.set(.65, 1.105, .05); g.add(sink);
    const vase = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.16, 0], [.2, .1], [.12, .35], [.09, .45], [.11, .5], [0, .5]].map(([a, b]) => new THREE.Vector2(a, b)), 48),
      new THREE.MeshPhysicalMaterial({ color: 0xd8cbb4, roughness: .7 })); vase.position.set(-1.05, 1.1, -.35); g.add(vase);
    const texs = {};
    g.userData.set = (hex, name) => {
      if (!texs[name]) { const m = MARBLE[name] || MARBLE.Calacatta; texs[name] = marbleTex(m[0], m[1], m[2], Object.keys(texs).length + 2); }
      mat.map = texs[name]; mat.color.set(0xffffff); mat.needsUpdate = true;
    };
    g.scale.setScalar(.92); g.position.y = -.05;
    return g;
  }
  function kafe() {
    const g = new THREE.Group();
    const cupM = new THREE.MeshPhysicalMaterial({ color: 0xf4f1ea, roughness: .18, clearcoat: 1 });
    const cupP = [[0, 0], [.5, 0], [.56, .06], [.66, .4], [.8, 1.1], [.84, 1.22], [.78, 1.22], [.74, 1.12], [.6, .5], [.5, .14], [0, .14]].map(([a, b]) => new THREE.Vector2(a, b));
    const cup = new THREE.Mesh(new THREE.LatheGeometry(cupP, 96), cupM); cup.position.y = .2; g.add(cup);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(.28, .07, 20, 48, Math.PI * 1.2), cupM);
    handle.position.set(.86, .85, 0); handle.rotation.z = -Math.PI * .6; g.add(handle);
    const sauc = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [1.1, 0], [1.4, .1], [1.45, .16], [1.38, .16], [1.05, .08], [0, .08]].map(([a, b]) => new THREE.Vector2(a, b)), 96), cupM); g.add(sauc);
    // köpüklü kahve (latte art benzeri)
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    const gr = x.createRadialGradient(256, 256, 30, 256, 256, 256); gr.addColorStop(0, '#e8cfa7'); gr.addColorStop(.55, '#b07a45'); gr.addColorStop(1, '#5a3418');
    x.fillStyle = gr; x.fillRect(0, 0, 512, 512);
    x.strokeStyle = '#f5e6cc'; x.lineWidth = 16; x.lineCap = 'round';
    for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(256, 300 - i * 34, 120 - i * 18, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
    const ct = new THREE.CanvasTexture(c); ct.colorSpace = THREE.SRGBColorSpace;
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(.75, 64), new THREE.MeshStandardMaterial({ map: ct, roughness: .5 }));
    coffee.rotation.x = -Math.PI / 2; coffee.position.y = .2 + 1.02; g.add(coffee);
    const spoon = new THREE.Mesh(new RoundedBoxGeometry(1.1, .03, .1, 2, .015), gold); spoon.position.set(.2, .13, .95); spoon.rotation.y = .3; g.add(spoon);
    g.userData.set = (hex) => cupM.color.set(hex);
    g.scale.setScalar(.95);
    return g;
  }
  function emlak() {
    const g = new THREE.Group();
    const wall = new THREE.MeshPhysicalMaterial({ color: 0xefede8, roughness: .6 });
    const dark = new THREE.MeshPhysicalMaterial({ color: 0x23262d, roughness: .4, metalness: .3 });
    const win = new THREE.MeshPhysicalMaterial({ color: 0x9fc3e8, roughness: .05, metalness: .2, emissive: 0xffc27a, emissiveIntensity: .0 });
    const wood = new THREE.MeshPhysicalMaterial({ color: 0x8a5a36, roughness: .55 });
    const grass = new THREE.Mesh(new RoundedBoxGeometry(3.6, .08, 2.6, 3, .03), new THREE.MeshStandardMaterial({ color: 0x3d6b45, roughness: .9 })); grass.position.y = .04; g.add(grass);
    const pool = new THREE.Mesh(new RoundedBoxGeometry(1.2, .02, .6, 2, .01), new THREE.MeshPhysicalMaterial({ color: 0x48b6d8, roughness: .05, emissive: 0x0d4c66, emissiveIntensity: .4 })); pool.position.set(.95, .09, .8); g.add(pool);
    const b1 = new THREE.Mesh(new RoundedBoxGeometry(2.2, .9, 1.4, 2, .02), wall); b1.position.set(-.3, .53, -.2); g.add(b1);
    const b2 = new THREE.Mesh(new RoundedBoxGeometry(1.5, .8, 1.2, 2, .02), wall); b2.position.set(.25, 1.38, -.35); g.add(b2);
    const roof1 = new THREE.Mesh(new RoundedBoxGeometry(2.4, .07, 1.6, 2, .02), dark); roof1.position.set(-.3, 1.0, -.2); g.add(roof1);
    const roof2 = new THREE.Mesh(new RoundedBoxGeometry(1.75, .07, 1.45, 2, .02), dark); roof2.position.set(.25, 1.82, -.35); g.add(roof2);
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, .62, .02), win); w1.position.set(-.35, .53, .51); g.add(w1);
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, .5, .02), win); w2.position.set(.25, 1.38, .26); g.add(w2);
    const clad = new THREE.Mesh(new THREE.BoxGeometry(.5, .8, .03), wood); clad.position.set(.66, .53, .51); g.add(clad);
    [-1.3, 1.4].forEach((xx, i) => {
      const tr = new THREE.Mesh(new THREE.SphereGeometry(.28 + i * .05, 20, 14), new THREE.MeshStandardMaterial({ color: 0x2f5a37, roughness: .9 }));
      tr.position.set(xx, .45, .9 - i * 1.6); g.add(tr);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, .3, 8), wood); st.position.set(xx, .2, .9 - i * 1.6); g.add(st);
    });
    g.userData.set = (hex, name) => {
      const night = name === 'Gece';
      wall.color.set(night ? '#efede8' : hex);
      win.emissiveIntensity = night ? 1.6 : 0; win.color.set(night ? '#ffd9a0' : '#9fc3e8');
      scene.background = null; key.intensity = night ? .35 : 1.6; rim.intensity = night ? .4 : .9;
    };
    g.scale.setScalar(1.05);
    return g;
  }
  const BUILD = { guzellik: serum, mermer, kafe, emlak };
  const cache = {};
  let cur = null, curKey = 'guzellik', swap = 1;

  const chips = root.querySelectorAll('[data-sector]');
  const swBox = root.querySelector('.swatches');
  const label = root.querySelector('.demo-label');
  const note = root.querySelector('.demo-note');
  const waBtn = root.querySelector('[data-demo-wa]');
  function pickSwatch(name, hex) {
    cur?.userData.set(hex, name); dirty = true;
    swBox.querySelectorAll('.sw').forEach((b) => b.setAttribute('aria-pressed', b.dataset.n === name));
    if (waBtn) waBtn.dataset.extra = `${SECTORS[curKey].label.split(' · ')[0]} için 3D modelli site (${name})`;
  }
  function show(k) {
    curKey = k; const S = SECTORS[k];
    chips.forEach((c) => c.setAttribute('aria-pressed', c.dataset.sector === k));
    if (cur) holder.remove(cur);
    cur = cache[k] || (cache[k] = BUILD[k]());
    holder.add(cur); swap = 0;
    ctl.target.set(0, { guzellik: 1.5, mermer: .95, kafe: .7, emlak: .85 }[k], 0);
    label.textContent = S.label; note.innerHTML = S.note;
    swBox.innerHTML = S.swatches.map(([n, h]) => `<button class="sw" data-n="${n}" data-h="${h}" aria-pressed="false" type="button"><i style="--c:${h}"></i>${n}</button>`).join('');
    swBox.querySelectorAll('.sw').forEach((b) => b.addEventListener('click', () => pickSwatch(b.dataset.n, b.dataset.h)));
    if (k !== 'emlak') { key.intensity = 1.6; rim.intensity = .9; }
    pickSwatch(S.swatches[0][0], S.swatches[0][1]);
    ctl.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  chips.forEach((c) => c.addEventListener('click', () => show(c.dataset.sector)));

  function size() {
    const r = canvas.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.setSize(r.width, r.height, false);
    cam.aspect = r.width / r.height;
    const off = cam.position.clone().sub(ctl.target).setLength(r.width / r.height < 1.1 ? 10.5 : 8.4);
    cam.position.copy(ctl.target).add(off);
    cam.updateProjectionMatrix(); dirty = true;
  }
  let vis = false, run = false, dirty = true;
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; go(); }).observe(canvas);
  function loop() {
    if (!vis || document.hidden) { run = false; return; }
    requestAnimationFrame(loop);
    if (swap < 1) { swap = Math.min(1, swap + .06); const s = 1 - Math.pow(1 - swap, 3); holder.scale.setScalar(.6 + .4 * s); holder.rotation.y = (1 - s) * -1.2; }
    const moved = ctl.update();
    if (moved || swap < 1 || dirty) { renderer.render(scene, cam); dirty = false; }
  }
  function go() { if (vis && !document.hidden && !run) { run = true; requestAnimationFrame(loop); } }
  document.addEventListener('visibilitychange', go);
  addEventListener('resize', size);
  show('guzellik'); size();
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); root.classList.add('no3d'); const d = document.createElement('div'); d.className = 'demo-load'; d.textContent = '3D geçici olarak durdu, sayfayı yenileyin.'; canvas.parentElement.appendChild(d); });
}
