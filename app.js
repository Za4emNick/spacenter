const SPA_LANGS = ['ru', 'ar', 'tr', 'en', 'de', 'pl', 'fr'];
const LANG_LABELS = { ru: 'RU', ar: 'AR', tr: 'TR', en: 'EN', de: 'DE', pl: 'PL', fr: 'FR' };

let currentLang = localStorage.getItem('spaCenterLang') || 'en';
let selectedService = null;
let currentGalleryIndex = 0;
let currentModalImageClickHandler = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const page = document.body.dataset.page;

function t(path) {
  const keys = path.split('.');
  let value = translations[currentLang] || translations.en;
  for (const key of keys) value = value?.[key];
  return value ?? path;
}

function getLocalized(value, fallback = '') {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[currentLang] || value.en || Object.values(value)[0] || fallback;
}

function categoryLabel(groupId, fallback) {
  return translations[currentLang]?.categoryLabels?.[groupId] || translations.en.categoryLabels[groupId] || fallback;
}

function getAllServices() {
  return Array.isArray(serviceItems) ? serviceItems : [];
}

function getAllPrograms() {
  return Array.isArray(spaPrograms) ? spaPrograms : [];
}

function getShortDescription(item) {
  return getLocalized(item?.shortDescription) || getLocalized(item?.description);
}

function getFullDescription(item) {
  return getLocalized(item?.fullDescription) || getLocalized(item?.description) || t('services.detailsText');
}

function getStepText(stepKey) {
  return stepTranslations?.[stepKey]?.[currentLang] || stepTranslations?.[stepKey]?.en || stepKey;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function imageTag(src, alt, className = '') {
  if (!src) return '';
  const classAttr = className ? ` class="${className}"` : '';
  return `<img${classAttr} src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.closest('.image-shell, .service-card-image, .program-card-image, .service-media')?.classList.add('is-missing'); this.remove();">`;
}

function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-lang-switch]').forEach((btn) => btn.classList.toggle('active', btn.dataset.langSwitch === currentLang));
  renderDynamic();
}

function setLanguage(lang) {
  if (!SPA_LANGS.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem('zenSpaLang', lang);
  applyTranslations();
}

function renderDynamic() {
  if (page === 'home') {
    renderFeatures();
    renderLocations();
    renderGallery();
  }
  if (page === 'services') {
    renderFilters();
    renderServices();
  }
}

function renderFeatures() {
  const root = $('#featureGrid');
  if (!root) return;
  const icons = ['◐', '✦', '♨', '◎', '✉', '★'];
  const items = Array.isArray(t('why.items')) ? t('why.items') : [];
  root.innerHTML = items.map((item, index) => `
    <article class="why-card">
      <span>${icons[index] || '✦'}</span>
      <strong>${escapeHtml(item)}</strong>
    </article>
  `).join('');
}

function renderLocations() {
  const root = $('#locationList');
  if (!root) return;
  root.innerHTML = hotelItems.map((hotel) => `<li>${escapeHtml(hotel.name)}</li>`).join('');
}

function renderGallery() {
  const root = $('#galleryGrid');
  if (!root) return;
  root.innerHTML = galleryItems.map((item, index) => `
    <button class="gallery-thumb" type="button" data-gallery-index="${index}" aria-label="Open ${escapeHtml(item.title)}">
      <span class="image-shell">${imageTag(item.src, item.title)}</span>
      <span>${escapeHtml(item.title)}</span>
    </button>
  `).join('');
  $$('[data-gallery-index]').forEach((btn) => btn.addEventListener('click', () => openGallery(Number(btn.dataset.galleryIndex))));
}

function renderFilters() {
  const root = $('#serviceFilter');
  if (!root) return;
  root.innerHTML = '';
}

function buildServiceCard(service) {
  const title = getLocalized(service.title);
  const desc = getShortDescription(service);
  const duration = service.duration ? `<p class="service-meta-line">${escapeHtml(t('services.duration'))}: ${escapeHtml(service.duration)}</p>` : '';

  return `
    <article class="service-card compact" role="button" tabindex="0" data-service-details="${escapeHtml(service.id)}">
      <div class="compact-body">
        <div class="service-card-top">
          <h3>${escapeHtml(title)}</h3>
          <span class="service-arrow">→</span>
        </div>
        ${duration}
        <p class="service-desc">${escapeHtml(desc)}</p>
        <button class="mini-book-btn" type="button" data-service-book="${escapeHtml(service.id)}">${escapeHtml(t('buttons.book'))}</button>
      </div>
    </article>`;
}

function buildProgramCard(program) {
  const title = getLocalized(program.title);
  const desc = getShortDescription(program);
  const steps = Array.isArray(program.steps) ? program.steps : [];
  const stepsHtml = steps.map((key) => `<li>${escapeHtml(getStepText(key))}</li>`).join('');

  return `
    <article class="service-card compact service-program-card" role="button" tabindex="0" data-program-id="${escapeHtml(program.id)}">
      <div class="program-card-image">${imageTag(program.image, title)}</div>
      <div class="compact-body">
        <div class="service-card-top">
          <h3>${escapeHtml(title)}</h3>
          <span class="service-arrow">↗</span>
        </div>
        <p class="service-meta-line">${escapeHtml(t('services.duration'))}: ${escapeHtml(program.duration || '')}</p>
        <p class="service-desc">${escapeHtml(desc)}</p>
        <div class="program-steps-preview">
          <strong>${escapeHtml(t('services.includes'))}</strong>
          <ul>${stepsHtml}</ul>
        </div>
        <button class="mini-book-btn" type="button" data-program-book="${escapeHtml(program.id)}">${escapeHtml(t('buttons.book'))}</button>
      </div>
    </article>`;
}

function renderServices() {
  const root = $('#serviceGroups');
  if (!root) return;

  const programs = getAllPrograms();
  const services = getAllServices();
  const ordered = ['hamam', 'localMassage', 'fullMassage', 'asianMassage'];

  const programsHtml = programs.map(buildProgramCard).join('');
  const programsSection = `
    <section class="service-category service-programs-section">
      <div class="service-category-head">
        <span class="eyebrow">${escapeHtml(categoryLabel('spaPrograms', 'Spa Programs'))}</span>
        <h2>${escapeHtml(categoryLabel('spaPrograms', 'Spa Programs'))}</h2>
      </div>
      <div class="programs-grid">${programsHtml}</div>
    </section>`;

  const servicesHtml = ordered.map((cat) => {
    const cards = services.filter((service) => service.category === cat).map(buildServiceCard).join('');
    if (!cards) return '';
    return `
      <section class="service-category">
        <h2>${escapeHtml(categoryLabel(cat, cat))}</h2>
        <div class="service-card-grid">${cards}</div>
      </section>`;
  }).join('');

  root.innerHTML = `${programsSection}${servicesHtml}`;

  $$('[data-service-details]').forEach((el) => {
    const open = () => openServiceModal(el.dataset.serviceDetails);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  $$('[data-program-id]').forEach((el) => {
    const open = () => openProgramModal(el.dataset.programId);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  $$('[data-service-book]').forEach((btn) => btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const service = getAllServices().find((item) => item.id === btn.dataset.serviceBook);
    if (!service) return;
    selectedService = service;
    window.open(buildWhatsAppUrl(service), '_blank', 'noopener,noreferrer');
  }));

  $$('[data-program-book]').forEach((btn) => btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const program = getAllPrograms().find((item) => item.id === btn.dataset.programBook);
    if (!program) return;
    selectedService = program;
    window.open(buildWhatsAppUrl(program), '_blank', 'noopener,noreferrer');
  }));
}

function fillServiceModal(item, categoryText, isProgram = false) {
  selectedService = item;
  const title = getLocalized(item.title);
  const duration = item.duration ? `${t('services.duration')}: ${item.duration}` : '';

  $('#serviceModalCategory').textContent = categoryText;
  $('#serviceModalTitle').textContent = title;
  $('#serviceModalDuration').textContent = duration;
  $('#serviceModalText').textContent = getFullDescription(item);

  const stepsWrap = $('#serviceModalSteps');
  if (stepsWrap) {
    if (isProgram && Array.isArray(item.steps) && item.steps.length) {
      stepsWrap.innerHTML = `
        <strong>${escapeHtml(t('services.includes'))}</strong>
        <ul>${item.steps.map((key) => `<li>${escapeHtml(getStepText(key))}</li>`).join('')}</ul>
      `;
      stepsWrap.hidden = false;
    } else {
      stepsWrap.innerHTML = '';
      stepsWrap.hidden = true;
    }
  }

  openModal('#serviceModal');
}

function openProgramModal(programId) {
  const program = getAllPrograms().find((item) => item.id === programId);
  if (!program) return;
  fillServiceModal(program, categoryLabel('spaPrograms', 'Spa Programs'), true);
}

function openServiceModal(serviceId) {
  const service = getAllServices().find((item) => item.id === serviceId);
  if (!service) return;
  fillServiceModal(service, categoryLabel(service.category, t('nav.services')), false);
}

function openGallery(index) {
  currentGalleryIndex = index;
  const item = galleryItems[currentGalleryIndex];
  const stage = $('#galleryStageImage');
  if (stage && item) {
    stage.src = item.src;
    stage.alt = item.title;
  }
  openModal('#galleryModal');
}

function openImageLightbox(src, alt = '') {
  const lightbox = $('#imageLightbox');
  const img = $('#imageLightboxImg');
  if (!lightbox || !img || !src) return;
  img.src = src;
  img.alt = alt;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
}

function closeImageLightbox() {
  const lightbox = $('#imageLightbox');
  const img = $('#imageLightboxImg');
  if (!lightbox || !img) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lightbox-open');
  setTimeout(() => {
    if (!lightbox.classList.contains('is-open')) {
      img.src = '';
      img.alt = '';
    }
  }, 200);
}

function shiftGallery(step) {
  currentGalleryIndex = (currentGalleryIndex + step + galleryItems.length) % galleryItems.length;
  openGallery(currentGalleryIndex);
}

function buildWhatsAppUrl(service) {
  const wa = t('wa');
  const lines = [wa.general];
  if (service) lines.push(`${wa.service}: ${getLocalized(service.title)}`);
  return `https://wa.me/905538270765?text=${encodeURIComponent(lines.join("\n"))}`;
}


function openModal(selector) {
  const modal = $(selector);
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModals() {
  $$('.modal-overlay').forEach((modal) => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  });
  document.body.classList.remove('modal-open');
}

function initMenu() {
  const menu = $('#languagePills');
  const toggle = $('#menuToggle');
  toggle?.addEventListener('click', () => {
    const open = menu?.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(Boolean(open)));
  });
}

function initBookingBarVisibility() {
  const bar = document.querySelector('.booking-bar.end-only');
  if (!bar) return;
  const toggle = () => {
    const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 140;
    bar.classList.toggle('visible', nearBottom);
  };
  window.addEventListener('scroll', toggle, { passive: true });
  window.addEventListener('resize', toggle);
  toggle();
}

function init() {
  applyTranslations();
  $$('[data-lang-switch]').forEach((btn) => btn.addEventListener('click', () => setLanguage(btn.dataset.langSwitch)));
  $$('.wa-trigger').forEach((btn) => btn.addEventListener('click', () => {
    selectedService = null;
    window.open('https://wa.me/905538270765', '_blank', 'noopener,noreferrer');
  }));
  $$('[data-close-modal]').forEach((btn) => btn.addEventListener('click', closeModals));
  $$('.modal-overlay').forEach((overlay) => overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeModals();
  }));
  $('#galleryPrev')?.addEventListener('click', () => shiftGallery(-1));
  $('#galleryNext')?.addEventListener('click', () => shiftGallery(1));
  $('#serviceModalBook')?.addEventListener('click', () => {
    closeModals();
    window.open(buildWhatsAppUrl(selectedService), '_blank', 'noopener,noreferrer');
  });
  $('#imageLightbox')?.addEventListener('click', (event) => {
    if (event.target.id === 'imageLightbox') closeImageLightbox();
  });
  $('.image-lightbox__close')?.addEventListener('click', closeImageLightbox);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if ($('#imageLightbox')?.classList.contains('is-open')) {
        closeImageLightbox();
      } else {
        closeModals();
      }
    }
    if ($('#galleryModal')?.classList.contains('active') && event.key === 'ArrowRight') shiftGallery(1);
    if ($('#galleryModal')?.classList.contains('active') && event.key === 'ArrowLeft') shiftGallery(-1);
  });
  initMenu();
  initBookingBarVisibility();
}

document.addEventListener('DOMContentLoaded', init);
