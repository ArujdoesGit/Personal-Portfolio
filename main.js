import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { projects } from './projects.js';

// ─── Renderer ───────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ─── Scene & Camera ──────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020015);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 45, 155);

// ─── Controls ────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 55;
controls.maxDistance = 380;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.28;

// ─── Lighting ────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x9977cc, 2.2));

const sunLight = new THREE.PointLight(0xffd060, 3.5, 900);
sunLight.position.set(130, 90, 80);
scene.add(sunLight);

const fillLight = new THREE.PointLight(0x8866ff, 2.2, 700);
fillLight.position.set(-110, -60, -110);
scene.add(fillLight);

const topLight = new THREE.PointLight(0x66ccff, 1.8, 600);
topLight.position.set(0, 160, -60);
scene.add(topLight);

// Camera-relative fill so planets are never fully dark
const camLight = new THREE.PointLight(0xffffff, 0.8, 600);
camera.add(camLight);
scene.add(camera);

// ─── Stars ───────────────────────────────────────────────────────────────────
function makeStarBatch(count, size, minR, maxR) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const palette = [
    [1.0, 1.0, 1.0],
    [0.72, 0.86, 1.0],
    [1.0, 0.95, 0.72],
    [1.0, 0.72, 0.90],
    [0.72, 1.0, 0.90],
  ];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = minR + Math.random() * (maxR - minR);
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const c = palette[Math.floor(Math.random() * palette.length)];
    col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

scene.add(makeStarBatch(5000, 1.1, 600, 900));
scene.add(makeStarBatch(1800, 2.4, 700, 1000));
scene.add(makeStarBatch(400,  4.5, 800, 1100));

// ─── Nebula (inner sphere backdrop) ─────────────────────────────────────────
function makeNebula() {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 1024;
  const ctx = cvs.getContext('2d');

  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, 1024, 1024);

  const blobs = [
    { x: 512, y: 380, r: 380, c0: 'rgba(90,22,180,0.55)',  c1: 'rgba(0,0,20,0)' },
    { x: 280, y: 620, r: 300, c0: 'rgba(20,55,170,0.42)',  c1: 'rgba(0,0,20,0)' },
    { x: 740, y: 700, r: 320, c0: 'rgba(170,20,80,0.30)',  c1: 'rgba(0,0,20,0)' },
    { x: 180, y: 280, r: 220, c0: 'rgba(20,130,170,0.28)', c1: 'rgba(0,0,20,0)' },
    { x: 820, y: 200, r: 200, c0: 'rgba(60,20,140,0.35)',  c1: 'rgba(0,0,20,0)' },
  ];
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, b.c0);
    g.addColorStop(1, b.c1);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 1024);
  }

  const tex = new THREE.CanvasTexture(cvs);
  const geo = new THREE.SphereGeometry(1800, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, opacity: 0.95 });
  return new THREE.Mesh(geo, mat);
}
scene.add(makeNebula());

// ─── Head (placeholder) ──────────────────────────────────────────────────────
function makeHeadTexture() {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 512;
  const ctx = cvs.getContext('2d');

  // Skin base
  const bg = ctx.createRadialGradient(256, 210, 55, 256, 256, 275);
  bg.addColorStop(0, '#f8c8a5');
  bg.addColorStop(0.65, '#e9a87c');
  bg.addColorStop(1, '#bf7545');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 512);

  // Hair
  ctx.fillStyle = '#18100a';
  ctx.beginPath();
  ctx.ellipse(256, 88, 196, 118, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(60, 88, 392, 125);

  // Hair detail highlight
  ctx.fillStyle = 'rgba(80,50,20,0.3)';
  ctx.beginPath();
  ctx.ellipse(200, 60, 70, 35, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = '#1a1005';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(126, 200); ctx.quadraticCurveTo(172, 186, 216, 198);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(296, 198); ctx.quadraticCurveTo(340, 186, 386, 200);
  ctx.stroke();

  // Eye whites
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(172, 250, 46, 37, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(340, 250, 46, 37,  0.1, 0, Math.PI * 2); ctx.fill();

  // Iris
  ctx.fillStyle = '#4a78cc';
  ctx.beginPath(); ctx.ellipse(172, 253, 29, 31, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(340, 253, 29, 31, 0, 0, Math.PI * 2); ctx.fill();

  // Iris inner glow
  ctx.fillStyle = '#6a9ae8';
  ctx.beginPath(); ctx.ellipse(172, 250, 18, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(340, 250, 18, 20, 0, 0, Math.PI * 2); ctx.fill();

  // Pupil
  ctx.fillStyle = '#080808';
  ctx.beginPath(); ctx.ellipse(172, 253, 14, 17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(340, 253, 14, 17, 0, 0, Math.PI * 2); ctx.fill();

  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.ellipse(163, 242, 7, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(331, 242, 7, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Nose
  ctx.strokeStyle = '#b06840';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(242, 295); ctx.quadraticCurveTo(224, 328, 240, 344);
  ctx.quadraticCurveTo(256, 354, 272, 344);
  ctx.quadraticCurveTo(288, 328, 270, 295);
  ctx.stroke();

  // Smile
  ctx.strokeStyle = '#8a3818';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(256, 348, 80, 0.22, Math.PI - 0.22);
  ctx.stroke();

  // Blush
  ctx.fillStyle = 'rgba(240,90,70,0.2)';
  ctx.beginPath(); ctx.ellipse(112, 310, 55, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(400, 310, 55, 30, 0, 0, Math.PI * 2); ctx.fill();

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const headGlowMesh = (() => {
  const geo = new THREE.SphereGeometry(22, 32, 32);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xff9944,
    transparent: true,
    opacity: 0.06,
    side: THREE.BackSide,
  });
  return new THREE.Mesh(geo, mat);
})();

const headMesh = (() => {
  const geo = new THREE.SphereGeometry(18, 64, 64);
  const mat = new THREE.MeshStandardMaterial({ map: makeHeadTexture(), roughness: 0.8, metalness: 0.0 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.add(headGlowMesh);
  scene.add(mesh);
  return mesh;
})();

// ─── Floating dust around head ───────────────────────────────────────────────
function makeDust() {
  const count = 320;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r     = 24 + Math.random() * 16;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffcc88,
    size: 0.55,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}
const dust = makeDust();
scene.add(dust);

// ─── Planets ─────────────────────────────────────────────────────────────────
function makePlanetTexture(color1, color2) {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 256;
  const ctx = cvs.getContext('2d');

  const grad = ctx.createRadialGradient(85, 75, 18, 128, 128, 145);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.09})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 11 + 2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 9 + 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const planetObjects = [];

projects.forEach((proj) => {
  const { orbitRadius, inclination, tiltZ, speed, phase, color1, color2, size = 5.5, hasRing } = proj;

  const tex  = makePlanetTexture(color1, color2);
  const geo  = new THREE.SphereGeometry(size, 36, 36);
  const mat  = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, metalness: 0.05 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.proj = proj;

  // Glow halo
  const glowGeo = new THREE.SphereGeometry(size * 1.38, 18, 18);
  const glowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color1),
    transparent: true,
    opacity: 0.0,
    side: THREE.BackSide,
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  mesh.add(glowMesh);
  mesh.userData.glow = glowMesh;

  // Optional ring (Saturn style)
  if (hasRing) {
    const ringGeo = new THREE.TorusGeometry(size * 1.85, size * 0.28, 6, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color1),
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.6;
    mesh.add(ring);
  }

  // Orbit group defines the orbital plane tilt
  const orbitGroup = new THREE.Group();
  orbitGroup.rotation.x = inclination;
  orbitGroup.rotation.z = tiltZ;
  scene.add(orbitGroup);

  // Orbit path line
  const orbitPts = [];
  for (let k = 0; k <= 128; k++) {
    const a = (k / 128) * Math.PI * 2;
    orbitPts.push(new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius));
  }
  orbitGroup.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(orbitPts),
    new THREE.LineBasicMaterial({ color: 0x334499, transparent: true, opacity: 0.22 })
  ));

  orbitGroup.add(mesh);
  planetObjects.push({ mesh, orbitRadius, speed, phase });
});

// ─── Interaction ─────────────────────────────────────────────────────────────
const raycaster  = new THREE.Raycaster();
const mouse      = new THREE.Vector2(-9999, -9999);
let hoveredPlanet = null;

const tooltip   = document.getElementById('tooltip');
const panel     = document.getElementById('panel');
const panelClose = document.getElementById('panel-close');

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth)  *  2 - 1;
  mouse.y = (e.clientY / window.innerHeight) * -2 + 1;
  tooltip.style.left = (e.clientX + 18) + 'px';
  tooltip.style.top  = (e.clientY - 10) + 'px';
});

window.addEventListener('click', () => {
  if (!hoveredPlanet) return;
  const proj = hoveredPlanet.userData.proj;
  document.getElementById('panel-emoji').textContent = proj.emoji;
  document.getElementById('panel-title').textContent  = proj.name;
  document.getElementById('panel-desc').textContent   = proj.desc;
  document.getElementById('panel-tags').innerHTML =
    proj.tags.map(t => `<span class="tag">${t}</span>`).join('');
  document.getElementById('panel-link').href = proj.link;
  panel.classList.add('visible');
  panel.classList.remove('hidden');
  controls.autoRotate = false;
});

panelClose.addEventListener('click', () => {
  panel.classList.remove('visible');
  controls.autoRotate = true;
});

// ─── Animation loop ──────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Head: slow spin + gentle bob
  headMesh.rotation.y  = t * 0.09;
  headMesh.position.y  = Math.sin(t * 0.7) * 0.6;

  // Head glow pulse
  headGlowMesh.material.opacity = 0.04 + Math.sin(t * 1.4) * 0.03;

  // Dust slow orbit
  dust.rotation.y = t * 0.06;

  // Planet orbits
  for (const { mesh, orbitRadius, speed, phase } of planetObjects) {
    const angle = t * speed + phase;
    mesh.position.x = Math.cos(angle) * orbitRadius;
    mesh.position.z = Math.sin(angle) * orbitRadius;
    mesh.position.y = 0;
    mesh.rotation.y = t * 0.45;
  }

  // Hover raycasting
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(planetObjects.map(p => p.mesh));
  const hit  = hits.length > 0 ? hits[0].object : null;

  if (hit !== hoveredPlanet) {
    hoveredPlanet = hit;
    if (hit) {
      tooltip.textContent = hit.userData.proj.name;
      tooltip.classList.add('visible');
      document.body.style.cursor = 'pointer';
    } else {
      tooltip.classList.remove('visible');
      document.body.style.cursor = 'default';
    }
  }

  // Smooth scale & glow for all planets
  for (const { mesh } of planetObjects) {
    const isHovered = mesh === hoveredPlanet;
    const targetScale = isHovered ? 1.18 : 1.0;
    const targetGlow  = isHovered ? 0.38 : 0.0;
    const s = mesh.scale.x + (targetScale - mesh.scale.x) * 0.1;
    mesh.scale.setScalar(s);
    const g = mesh.userData.glow.material;
    g.opacity += (targetGlow - g.opacity) * 0.1;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

// ─── Resize ──────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
