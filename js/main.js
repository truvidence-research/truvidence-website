(() => {
  const navbar = document.querySelector('.navbar-tru');
  const toggler = document.querySelector('.navbar-toggler-tru');
  const collapse = document.getElementById('mainNav');
  const back = document.querySelector('.back-to-top');
  const onScroll = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 24);
    back?.classList.toggle('show', window.scrollY > 520);
  };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
  toggler?.addEventListener('click', () => toggler.classList.toggle('active'));
  collapse?.addEventListener('hidden.bs.collapse', () => toggler?.classList.remove('active'));
  document.querySelectorAll('#mainNav .nav-link').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth < 992 && collapse?.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(collapse).hide();
  }));
  back?.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));
  const obs = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
  }), {threshold:.12, rootMargin:'0px 0px -30px'}) : null;
  document.querySelectorAll('.reveal').forEach((el,i) => {
    el.style.transitionDelay = `${Math.min((i % 4) * 70,210)}ms`;
    if (obs) obs.observe(el); else el.classList.add('is-visible');
  });
  // Subtle Nexora-inspired pointer depth, disabled on touch/reduced motion.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.interactive-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r=card.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5; const y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`translateY(-7px) perspective(900px) rotateX(${(-y*2.2).toFixed(2)}deg) rotateY(${(x*2.2).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => card.style.transform='');
    });
  }
  // Contact form: validate and open a populated email draft; no server endpoint is invented.
  const form=document.getElementById('contactForm');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    const data=new FormData(form);
    const subject=encodeURIComponent('Truvidence research enquiry');
    const lines=[
      `Title: ${data.get('title')||''}`,
      `First Name: ${data.get('firstName')||''}`,
      `Last Name: ${data.get('lastName')||''}`,
      `Organization: ${data.get('organization')||''}`,
      `Work Email: ${data.get('workEmail')||''}`,
      `Area of Enquiry: ${data.get('areaOfEnquiry')||''}`,
      '', 'Research Need:', data.get('researchNeed')||''
    ];
    location.href=`mailto:connect@truvidenceresearch.com?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;
  });
})();


// Truvidence approach tabs: active state + scrollable mobile centering, without reordering DOM elements.
(() => {
  const nav = document.querySelector('.approach-nav');
  const inner = nav?.querySelector('.inner');
  if (!nav || !inner) return;

  const tabs = Array.from(inner.querySelectorAll('.approach-nav-card'));
  const targetFor = tab => document.querySelector(tab.getAttribute('href'));

  const setActive = (activeTab, center = false) => {
    tabs.forEach(tab => {
      const active = tab === activeTab;
      tab.classList.toggle('is-active', active);
      if (active) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });

    if (center && activeTab) {
      const maxScroll = Math.max(0, inner.scrollWidth - inner.clientWidth);
      const targetLeft = Math.min(
        maxScroll,
        Math.max(0, activeTab.offsetLeft - (inner.clientWidth - activeTab.offsetWidth) / 2)
      );
      inner.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  };

  const scrollToSection = tab => {
    const target = targetFor(tab);
    if (!target) return;
    const navHeight = nav.getBoundingClientRect().height;
    const stickyTop = window.innerWidth <= 767 ? 66 : 78;
    const y = target.getBoundingClientRect().top + window.scrollY - navHeight - stickyTop - 10;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      setActive(tab, true);
      scrollToSection(tab);
      history.replaceState(null, '', tab.getAttribute('href'));
    });
  });

  // Keep active state in sync when the user scrolls through sections.
  const sectionPairs = tabs
    .map(tab => ({ tab, section: targetFor(tab) }))
    .filter(pair => pair.section);

  if ('IntersectionObserver' in window && sectionPairs.length) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a,b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));
      if (!visible.length) return;
      const pair = sectionPairs.find(item => item.section === visible[0].target);
      if (pair) setActive(pair.tab, window.innerWidth <= 767);
    }, { rootMargin: '-34% 0px -55% 0px', threshold: 0 });
    sectionPairs.forEach(({section}) => observer.observe(section));
  }

  const initial = tabs.find(tab => tab.getAttribute('href') === window.location.hash) || tabs[0];
  if (initial) setActive(initial, window.innerWidth <= 767);
})();

// Keep the two Contact columns visually aligned on desktop by sizing the research-need field
// to the available height of the left information column.
(() => {
  const row = document.querySelector('.contact-main-row');
  if (!row) return;
  const left = row.querySelector(':scope > .col-lg-5');
  const panel = row.querySelector('.form-panel');
  const textarea = row.querySelector('#cf-research-need');
  if (!left || !panel || !textarea) return;

  const sync = () => {
    if (window.innerWidth < 992) {
      textarea.style.height = '';
      return;
    }

    textarea.style.height = '96px';
    requestAnimationFrame(() => {
      const targetHeight = left.getBoundingClientRect().height;
      const currentHeight = panel.getBoundingClientRect().height;
      const currentTextareaHeight = textarea.getBoundingClientRect().height;
      const adjusted = Math.max(82, Math.min(190, currentTextareaHeight + (targetHeight - currentHeight)));
      textarea.style.height = `${Math.round(adjusted)}px`;
    });
  };

  window.addEventListener('load', sync, { once: true });
  window.addEventListener('resize', sync, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(sync);
})();
