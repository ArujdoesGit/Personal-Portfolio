// ─── EmailJS config ──────────────────────────────────────────────────────────
// 1. Sign up free at https://emailjs.com
// 2. Add a Gmail service → copy the Service ID below
// 3. Create an email template using variables {{from_name}}, {{from_email}}, {{message}}
//    and set the "To Email" to arjunhari.chie@gmail.com → copy the Template ID below
// 4. Go to Account → Public Key → paste it in index.html where it says YOUR_PUBLIC_KEY
const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const rocketWrap   = document.getElementById('rocket-wrap');
const modal        = document.getElementById('contact-modal');
const contactClose = document.getElementById('contact-close');
const form         = document.getElementById('contact-form');
const sendBtn      = document.getElementById('send-btn');
const toast        = document.getElementById('success-toast');

// ─── Open / close ────────────────────────────────────────────────────────────
rocketWrap.addEventListener('click', (e) => {
  // Don't toggle while launching
  if (rocketWrap.classList.contains('launching')) return;
  modal.classList.toggle('open');
});

contactClose.addEventListener('click', (e) => {
  e.stopPropagation();
  modal.classList.remove('open');
});

// Prevent clicks inside modal from bubbling to rocketWrap
modal.addEventListener('click', (e) => e.stopPropagation());

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function spawnSlashes() {
  const rect = rocketWrap.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;

  const configs = [
    { dx: -60, dy: -18, angle: -20, cls: ''        },
    { dx: -20, dy:  10, angle: -35, cls: 'slash-2' },
    { dx:  30, dy: -30, angle: -15, cls: ''        },
    { dx:  60, dy:   5, angle: -28, cls: 'slash-2' },
  ];

  configs.forEach(({ dx, dy, angle, cls }) => {
    const el = document.createElement('div');
    el.className = 'slash-mark ' + cls;
    el.style.left = (cx + dx) + 'px';
    el.style.top  = (cy + dy) + 'px';
    el.style.setProperty('--angle', angle + 'deg');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  });
}

function flyPlaneToRocket() {
  // Create paper plane element at the send button
  const plane = document.createElement('div');
  plane.id = 'paper-plane';
  plane.textContent = '✉️';
  document.body.appendChild(plane);

  // Start at send button
  const btnRect    = sendBtn.getBoundingClientRect();
  const rocketRect = rocketWrap.getBoundingClientRect();

  const startX = btnRect.left + btnRect.width  / 2;
  const startY = btnRect.top  + btnRect.height / 2;
  const endX   = rocketRect.left + rocketRect.width  / 2;
  const endY   = rocketRect.top  + rocketRect.height / 2;

  plane.style.left = startX + 'px';
  plane.style.top  = startY + 'px';

  // Animate to rocket using a keyframe-on-the-fly approach
  const duration = 700; // ms
  const start = performance.now();

  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    // Ease out cubic
    const e = 1 - Math.pow(1 - t, 3);
    // Slight arc upward
    const arc = Math.sin(t * Math.PI) * -60;

    plane.style.left    = (startX + (endX - startX) * e) + 'px';
    plane.style.top     = (startY + (endY - startY) * e + arc) + 'px';
    plane.style.opacity = 1 - t;
    plane.style.transform = `scale(${1 - t * 0.7}) rotate(${e * -30}deg)`;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      plane.remove();
    }
  }

  requestAnimationFrame(step);
}

function showToast() {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function resetRocket() {
  rocketWrap.classList.remove('launching', 'rumbling', 'winding-up');
  // Re-enable the idle float animation
  rocketWrap.style.animation = '';
  void rocketWrap.offsetWidth; // reflow to restart animation
  rocketWrap.style.animation = null;
}

// ─── Form submit ─────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name    = form.from_name.value.trim();
  const email   = form.from_email.value.trim();
  const message = form.message.value.trim();

  if (!name || !email || !message) return;

  // Disable button while sending
  sendBtn.disabled = true;
  sendBtn.textContent = 'Sending…';

  // 1 — Envelope flies from form to Renekton
  flyPlaneToRocket();
  await sleep(700);

  // 2 — Close modal
  modal.classList.remove('open');
  await sleep(150);

  // 3 — Wind-up (crouching before dash)
  rocketWrap.classList.add('winding-up');
  await sleep(380);

  // 4 — Send email (fire & forget)
  emailjs
    .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { from_name: name, from_email: email, message })
    .catch((err) => console.error('EmailJS error:', err));

  // 5 — Slash marks then DICE off screen
  spawnSlashes();
  rocketWrap.classList.remove('winding-up');
  rocketWrap.classList.add('launching');
  await sleep(950);

  // 6 — Reset everything
  form.reset();
  sendBtn.disabled = false;
  sendBtn.innerHTML = 'Launch it <span class="btn-rocket">🚀</span>';
  resetRocket();

  // 7 — Success toast
  showToast();
});
