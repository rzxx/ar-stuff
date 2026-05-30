const viewer = document.querySelector('model-viewer');

const FX_MAP = {
  sepia: { filter: 'sepia(0.7) saturate(1.2)' },
  grayscale: { filter: 'grayscale(1) contrast(1.1)' },
  invert: { filter: 'invert(1) hue-rotate(180deg)' },
  cool: { filter: 'hue-rotate(200deg) saturate(0.9) brightness(0.95)' },
  warm: { filter: 'sepia(0.35) saturate(1.6) hue-rotate(-10deg) brightness(1.05)' },
};

const activeFX = new Set();

function markEdited() {
  document.getElementById('fx-reset')?.classList.remove('active');
}

function applyFX() {
  const parts = [];
  let vignette = false;
  for (const fx of activeFX) {
    if (fx === 'vignette') { vignette = true; continue; }
    if (FX_MAP[fx]) parts.push(FX_MAP[fx].filter);
  }
  viewer.style.filter = parts.join(' ');
  toggleVignette(vignette);
}

let vignetteEl = null;
function toggleVignette(on) {
  if (on && !vignetteEl) {
    vignetteEl = document.createElement('div');
    vignetteEl.id = 'vignette-overlay';
    vignetteEl.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 5;
      background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%);
      transition: opacity 0.3s;
    `;
    document.body.appendChild(vignetteEl);
  }
  if (vignetteEl) vignetteEl.style.opacity = on ? '1' : '0';
  if (!on && vignetteEl) {
    vignetteEl.remove();
    vignetteEl = null;
  }
}

function toggleFX(name) {
  const btn = document.querySelector(`[data-fx="${name}"]`);
  if (activeFX.has(name)) {
    activeFX.delete(name);
    btn?.classList.remove('active');
  } else {
    activeFX.add(name);
    btn?.classList.add('active');
  }
  applyFX();
}

function resetAllFX() {
  activeFX.clear();
  document.querySelectorAll('.fx-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('fx-reset').classList.add('active');
  viewer.style.filter = '';
  toggleVignette(false);
  document.getElementById('tone-mapping').value = 'neutral';
  viewer.toneMapping = 'neutral';
  document.getElementById('exposure').value = '1';
  viewer.exposure = 1;
  document.getElementById('exposure-value').textContent = '1.00';
  document.getElementById('shadow').value = '0.65';
  viewer.shadowIntensity = 0.65;
  document.getElementById('shadow-value').textContent = '0.65';
}

function waitForModelLoad() {
  if (viewer.loaded) return Promise.resolve();
  return new Promise(resolve => {
    viewer.addEventListener('load', resolve, { once: true });
  });
}

function renderAnimations() {
  const anims = viewer.availableAnimations;
  const container = document.getElementById('anim-buttons');
  container.innerHTML = '';

  if (anims.length === 0) {
    container.innerHTML = '<span style="color:#666;font-size:12px">No animations</span>';
  } else {
    anims.forEach((name) => {
      const btn = document.createElement('button');
      btn.textContent = name;
      btn.dataset.anim = name;
      if (name === viewer.animationName) btn.classList.add('active');
      btn.addEventListener('click', () => {
        container.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        viewer.animationName = name;
        viewer.play();
      });
      container.appendChild(btn);
    });
  }
}

async function init() {
  await customElements.whenDefined('model-viewer');
  await viewer.updateComplete;
  await waitForModelLoad();

  renderAnimations();

  document.getElementById('tone-mapping').addEventListener('change', (e) => {
    viewer.toneMapping = e.target.value;
    markEdited();
  });

  document.getElementById('exposure').addEventListener('input', (e) => {
    viewer.exposure = parseFloat(e.target.value);
    document.getElementById('exposure-value').textContent = parseFloat(e.target.value).toFixed(2);
    markEdited();
  });

  document.getElementById('shadow').addEventListener('input', (e) => {
    viewer.shadowIntensity = parseFloat(e.target.value);
    document.getElementById('shadow-value').textContent = parseFloat(e.target.value).toFixed(2);
    markEdited();
  });

  document.querySelectorAll('.fx-btn[data-fx]').forEach(btn => {
    btn.addEventListener('click', () => {
      markEdited();
      toggleFX(btn.dataset.fx);
    });
  });

  document.getElementById('fx-reset').addEventListener('click', resetAllFX);
}

init();
