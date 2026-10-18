/* ==========================================
   DIGITAL RESUME BOOK — CONTROLLER
   ==========================================
   A premium interactive book resume.
   - Opens/closes as full-screen modal
   - Page-flip (prev/next), page indicator
   - Keyboard (← / → / Esc), swipe, touch
   - Zoom, fullscreen, table-of-contents
   - Downloads PDF resume
   - Reduced-motion support, ARIA labels
========================================== */
(function () {
  'use strict';

  const data = window.ResumeData || {};

  /* ---------- Icon helper ---------- */
  function iconFor(skill) {
    const s = skill.toLowerCase();
    if (s.includes('python')) return 'fab fa-python';
    if (s.includes('r ')) return 'fab fa-r-project';
    if (s.includes('sql') || s.includes('mysql') || s.includes('postgres') || s.includes('sql server')) return 'fas fa-database';
    if (s.includes('excel')) return 'fas fa-file-excel';
    if (s.includes('power bi') || s.includes('tableau') || s.includes('plotly') || s.includes('streamlit')) return 'fas fa-chart-pie';
    if (s.includes('git')) return 'fab fa-git-alt';
    if (s.includes('jupyter') || s.includes('colab')) return 'fas fa-flask';
    if (s.includes('tensorflow') || s.includes('scikit') || s.includes('ml')) return 'fas fa-brain';
    if (s.includes('pandas') || s.includes('numpy')) return 'fas fa-calculator';
    if (s.includes('dax')) return 'fas fa-cube';
    if (s.includes('vs code') || s.includes('visual')) return 'fas fa-code';
    return 'fas fa-gear';
  }

  /* ---------- Page DOM builders ---------- */
  function buildPages() {
    const pages = [];

    /* Cover */
    pages.push(`<div class="rb-page rb-cover" data-page="cover" role="group" aria-label="Cover">
      <div class="rb-cover-inner">
        <img class="rb-cover-photo" src="${data.personal.photo || ''}" alt="Portrait of ${data.personal.name || ''}" loading="lazy" decoding="async">
        <span class="rb-eyebrow" style="color:#7dd3fc;">Interactive Resume</span>
        <h1>${data.personal.name || ''}</h1>
        <div class="rb-cover-title">${data.personal.title || ''}</div>
        <p class="rb-cover-tagline">${data.personal.tagline || ''}</p>
        <button class="rb-cover-btn" type="button" data-action="open">Open Resume <i class="fas fa-book-open"></i></button>
<span class="rb-cover-hint">Use ← → keys or swipe to flip through the pages</span>
      </div>
    </div>`);

    /* 1 - About */
    pages.push(`<div class="rb-page" data-page="about" role="group" aria-label="About me">
      <div class="rb-page-inner">
        <div class="rb-page-head"><span class="rb-eyebrow">Page 01</span><h2>About Me</h2><span class="rb-page-no">1 / 9</span></div>
        <p class="rb-about-text">${data.personal.summary || ''}</p>
        <div class="rb-about-grid">
          <div class="rb-info-item"><span class="lbl">Career objective</span><span class="val">${data.personal.objective || ''}</span></div>
          <div class="rb-info-item"><span class="lbl">Location</span><span class="val">${data.personal.location || ''}</span></div>
          <div class="rb-info-item"><span class="lbl">Education</span><span class="val">B.Tech AI &amp; Data Science</span></div>
          <div class="rb-info-item"><span class="lbl">Degree</span><span class="val">Artificial Intelligence &amp; Data Science</span></div>
        </div>
      </div>
    </div>`);

    /* 2 - Education */
    let eduHtml = '';
    (data.education || []).forEach(function (e) {
      eduHtml += `<div class="rb-edu-item">
        <h3>${e.degree || ''}</h3>
        <div class="rb-edu-meta">${[e.school, e.location].filter(Boolean).join(' · ')}</div>
        <div class="rb-edu-detail">${e.period || ''}${e.detail ? '  |  ' + e.detail : ''}</div>
        ${e.note ? '<p>' + e.note + '</p>' : ''}
      </div>`;
    });
    pages.push(`<div class="rb-page" data-page="education" role="group" aria-label="Education">
      <div class="rb-page-inner">
        <div class="rb-page-head"><span class="rb-eyebrow">Page 02</span><h2>Education</h2><span class="rb-page-no">2 / 9</span></div>
        <div style="padding-top:4px;">${eduHtml}</div>
      </div>
    </div>`);

    /* 3 - Skills */
    let skillsHtml = '';
    var skillCats = [
      ['Programming', 'fas fa-code', data.skills || {}, 'programming'],
      ['Data Analytics', 'fas fa-chart-line', data.skills || {}, 'analytics'],
      ['Databases', 'fas fa-database', data.skills || {}, 'databases'],
      ['Tools & Technologies', 'fas fa-gear', data.skills || {}, 'tools']
    ];
    skillCats.forEach(function (c) {
      var items = (data.skills && data.skills[c[3]]) || [];
      if (!items.length) return;
      var chips = items.map(function (k) {
        return '<span class="rb-skill-chip">' + k + '</span>';
      }).join('');
      skillsHtml += '<div class="rb-skill-cat"><h3><i class="' + c[1] + '"></i> ' + c[0] + '</h3><div class="rb-skill-chips">' + chips + '</div></div>';
    });
    pages.push(`<div class="rb-page" data-page="skills" role="group" aria-label="Technical skills">
      <div class="rb-page-inner">
        <div class="rb-page-head"><span class="rb-eyebrow">Page 03</span><h2>Technical Skills</h2><span class="rb-page-no">3 / 9</span></div>
        ${skillsHtml}
      </div>
    </div>`);

    /* 4 - Experience */
    let expHtml = '';
    (data.experience || []).forEach(function (x) {
      var points = (x.points || []).map(function (p) { return '<li>' + p + '</li>'; }).join('');
      expHtml += `<div class="rb-exp-item">
        <h3>${x.role || ''}</h3>
        <div class="rb-exp-meta">${x.company || ''}${x.location ? ' · ' + x.location : ''} · <span>${x.period || ''}</span></div>
        ${x.tools ? '<div class="rb-exp-meta" style="color:#64748b;">Tools: ' + x.tools + '</div>' : ''}
        ${points ? '<ul>' + points + '</ul>' : ''}
      </div>`;
    });
    pages.push(`<div class="rb-page" data-page="experience" role="group" aria-label="Experience">
      <div class="rb-page-inner">
        <div class="rb-page-head"><span class="rb-eyebrow">Page 04</span><h2>Experience</h2><span class="rb-page-no">4 / 9</span></div>
        ${expHtml}
      </div>
    </div>`);

    /* 5 - Projects */
    let projHtml = '';
    (data.projects || []).forEach(function (p) {
      var tags = (p.technologies || []).map(function (t) { return '<span>' + t + '</span>'; }).join('');
      var links = '';
      if (p.github) links += '<a class="rb-github" href="' + p.github + '" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> GitHub</a>';
      if (p.demo) links += '<a class="rb-demo" href="' + p.demo + '" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt"></i> Live Demo</a>';
      projHtml += `<div class="rb-project-card">
        <h3>${p.title || ''}</h3>
        <p>${p.description || ''}</p>
        <div class="rb-project-tags">${tags}</div>
        <div class="rb-project-links">${links}</div>
      </div>`;
    });
    pages.push(`<div class="rb-page" data-page="projects" role="group" aria-label="Projects">
      <div class="rb-page-inner">
        <div class="rb-page-head"><span class="rb-eyebrow">Page 05</span><h2>Projects</h2><span class="rb-page-no">5 / 9</span></div>
        ${projHtml}
      </div>
    </div>`);

    /* 6 - Certifications */
    let certHtml = '';
    (data.certifications || []).forEach(function (c) {
      var thumb = c.image
        ? '<img class="rb-cert-thumb" src="' + c.image + '" alt="' + (c.name || 'certificate') + '" loading="lazy">'
        : '<div class="rb-cert-thumb rb-noimg"><i class="fas fa-certificate"></i></div>';
      certHtml += `<div class="rb-cert-card">
        ${thumb}
        <div class="rb-cert-info">
          <h3>${c.name || ''}</h3>
          <div class="issuer">${[c.issuer, c.year].filter(Boolean).join(' · ')}</div>
          ${c.link ? '<a href="' + c.link + '" target="_blank" rel="noopener noreferrer"><i class="fas fa-link"></i> Verify credential</a>' : '<span class="issuer" style="font-size:0.66rem;">Credential link unavailable</span>'}
        </div>
      </div>`;
    });
    pages.push(`<div class="rb-page" data-page="certifications" role="group" aria-label="Certifications">
      <div class="rb-page-inner">
        <div class="rb-page-head"><span class="rb-eyebrow">Page 06</span><h2>Certifications</h2><span class="rb-page-no">6 / 9</span></div>
        <div style="padding-top:4px;">${certHtml}</div>
      </div>
    </div>`);

    /* 7 - Achievements */
    let achHtml = '';
    (data.achievements || []).forEach(function (a) {
      achHtml += `<div class="rb-achieve-card"><div class="ic"><i class="fas fa-trophy"></i></div><h3>${a.title || ''}</h3><p>${a.detail || ''}</p></div>`;
    });
    pages.push(`<div class="rb-page" data-page="achievements" role="group" aria-label="Achievements">
      <div class="rb-page-inner">
        <div class="rb-page-head"><span class="rb-eyebrow">Page 07</span><h2>Achievements</h2><span class="rb-page-no">7 / 9</span></div>
        <div class="rb-achieve-grid">${achHtml}</div>
      </div>
    </div>`);

    /* 8 - Tools & Technologies */
    let toolsHtml = '';
    var toolGroups = data.tools || {};
    Object.keys(toolGroups).forEach(function (grp) {
      var items = toolGroups[grp] || [];
      if (!items.length) return;
      var chips = items.map(function (t) {
        return '<span class="rb-tool-chip"><i class="' + iconFor(t) + '"></i> ' + t + '</span>';
      }).join('');
      toolsHtml += '<div class="rb-tools-cat"><h3>' + grp + '</h3><div class="tchips">' + chips + '</div></div>';
    });
    pages.push(`<div class="rb-page" data-page="tools" role="group" aria-label="Tools and technologies">
      <div class="rb-page-inner">
        <div class="rb-page-head"><span class="rb-eyebrow">Page 08</span><h2>Tools &amp; Technologies</h2><span class="rb-page-no">8 / 9</span></div>
        <div class="rb-tools-grid">${toolsHtml}</div>
      </div>
    </div>`);

    /* 9 - Contact */
    var s = data.social || {};
    pages.push(`<div class="rb-page" data-page="contact" role="group" aria-label="Contact">
      <div class="rb-page-inner rb-contact">
        <div class="rb-page-head"><span class="rb-eyebrow">Page 09</span><h2>Let's Connect</h2><span class="rb-page-no">9 / 9</span></div>
        <p class="sub">Feel free to reach out — I'd love to talk about data, analytics, or opportunities.</p>
        <div class="rb-contact-methods">
          <a class="rb-contact-method" href="mailto:${s.email || ''}" aria-label="Email">
            <div class="ic"><i class="fas fa-envelope"></i></div>
            <div><div class="lbl">Email</div><div class="val">${s.email || ''}</div></div>
          </a>
          <a class="rb-contact-method" href="${s.linkedin || '#'}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <div class="ic"><i class="fab fa-linkedin-in" style="color:#0a66c2;"></i></div>
            <div><div class="lbl">LinkedIn</div><div class="val">linkedin.com/in/ankit-kumar</div></div>
          </a>
          <a class="rb-contact-method" href="${s.github || '#'}" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <div class="ic"><i class="fab fa-github"></i></div>
            <div><div class="lbl">GitHub</div><div class="val">github.com/ankitbuilds-SEC</div></div>
          </a>
          ${s.portfolio ? '<a class="rb-contact-method" href="' + s.portfolio + '" target="_blank" rel="noopener noreferrer" aria-label="Portfolio"><div class="ic"><i class="fas fa-globe"></i></div><div><div class="lbl">Portfolio</div><div class="val">ankitbuilds-SEC.github.io</div></div></a>' : ''}
          <div class="rb-contact-method"><div class="ic"><i class="fas fa-map-marker-alt"></i></div><div><div class="lbl">Location</div><div class="val">${data.personal.location || 'India'}</div></div></div>
        </div>
        <div class="rb-contact-actions">
          <a class="em" href="mailto:${s.email || ''}"><i class="fas fa-paper-plane"></i> Email Me</a>
          <a class="li" href="${s.linkedin || '#'}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin-in"></i> LinkedIn</a>
          <a class="gh" href="${s.github || '#'}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i> GitHub</a>
          <button type="button" class="pdf" data-action="download"><i class="fas fa-file-pdf"></i> Download PDF</button>
        </div>
      </div>
    </div>`);

    /* Back cover */
    pages.push(`<div class="rb-page rb-backcover" data-page="backcover" role="group" aria-label="Back cover">
      <div class="rb-backcover-inner">
        <i class="fas fa-book" style="font-size:2.5rem;"></i>
        <h2>Thank you for reading</h2>
        <p>${data.personal.name || ''} · ${data.personal.title || ''}</p>
        <button type="button" class="rb-cover-btn" data-action="close">Close Resume Book</button>
      </div>
    </div>`);

    return pages;
  }

  /* ---------- Build modal handler ---------- */
  function initBook(overlay, pages) {
    const stage = overlay.querySelector('.resume-book-stage');
    const book = overlay.querySelector('.resume-book');
    const indicator = overlay.querySelector('.rb-page-indicator');
    const prevBtn = overlay.querySelector('[data-nav="prev"]');
    const nextBtn = overlay.querySelector('[data-nav="next"]');
    const zoomBtn = overlay.querySelector('[data-action="zoom"]');
    const fsBtn = overlay.querySelector('[data-action="fullscreen"]');
    const closeBtn = overlay.querySelector('[data-action="close"]');
    const tocBtn = overlay.querySelector('[data-action="toc"]');
    const tocWrap = overlay.querySelector('.rb-toc-wrap');
    const tocMenu = overlay.querySelector('.rb-toc-menu');
    const downloadBtn = overlay.querySelector('[data-action="download"]');

    // ---- Build order like a real notebook ----
    // [blank inside-cover, cover, about ... backcover, back-flap]
    function blankPage(label) {
      return '<div class="rb-page rb-blank-page" data-page="' + label + '" role="group" aria-label="' + label + '"><div class="rb-paper-texture"></div></div>';
    }
    var sheets = pages.slice();
    sheets.unshift(blankPage('inside-cover'));
    sheets.push(blankPage('back-flap'));

    var LAST = sheets.length - 1;       // index of trailing flap (never flipped as a right page)

    // ---- Two-page open spread (like a real open notebook) ----
    book.innerHTML = '';
    var leftEl = document.createElement('div');
    leftEl.className = 'rb-half rb-half--left';
    var rightEl = document.createElement('div');
    rightEl.className = 'rb-half rb-half--right';
    book.appendChild(leftEl);
    book.appendChild(rightEl);

    // Indexes of the pages currently on the two halves
    var leftIdx = 0;   // 0 = inside-cover (blank)
    var rightIdx = 1;  // 1 = cover

    var isTurning = false;
    var autoRunning = false;
    var autoTimer = null;

    var FLIP_MS = 850;      // duration of a single page turn
    var COVER_PAUSE = 1700; // pause on the cover before the book opens
    var GAP_MS = 1750;      // pause between automatic page turns

    function setPage(el, idx) {
      el.innerHTML = sheets[idx];
      bindPageActions(el);
    }

    function bindPageActions(el) {
      var openBtn = el.querySelector('[data-action="open"]');
      if (openBtn) openBtn.addEventListener('click', function () { stopAuto(); goNext(); });
      var closeCoverBtn = el.querySelector('[data-action="close"]');
      if (closeCoverBtn) closeCoverBtn.addEventListener('click', close);
    }

    function labelFor(i) {
      if (i === 1) return 'Cover';
      if (i === sheets.length - 2) return 'Back cover';
      var content = i - 1; // content pages map to 1..9
      return 'Page ' + content + ' of 9';
    }

    function refresh() {
      if (indicator) indicator.textContent = labelFor(rightIdx);
      if (prevBtn) prevBtn.disabled = rightIdx <= 1;
      if (nextBtn) nextBtn.disabled = rightIdx >= LAST;
    }

    function clearTurn() {
      var t = book.querySelector('.rb-turn');
      if (t) t.remove();
      isTurning = false;
    }

    function makeTurn(dir, contentHtml) {
      var turn = document.createElement('div');
      turn.className = 'rb-half rb-turn rb-turn--' + (dir > 0 ? 'next' : 'prev');
      turn.innerHTML = contentHtml;
      bindPageActions(turn);
      book.appendChild(turn);
      return turn;
    }

    /* Flip the right page over to the left (moving forward). */
    function goNext(cb) {
      if (isTurning || rightIdx >= LAST) { if (cb) cb(); return; }
      isTurning = true;
      var flipper = sheets[rightIdx];            // this leaf turns to the left
      var newRight = rightIdx + 1;               // revealed underneath
      var turn = makeTurn(1, flipper);

      // Reveal the next right page beneath the turning leaf.
      setPage(rightEl, sheets[newRight]);

      requestAnimationFrame(function () {
        requestAnimationFrame(function () { turn.classList.add('turning'); });
      });

      setTimeout(function () {
        setPage(leftEl, flipper);                // flipped leaf lands on the left
        turn.remove();
        rightIdx = newRight;
        leftIdx = rightIdx - 1;
        isTurning = false;
        refresh();
        if (cb) cb();
      }, FLIP_MS);
    }

    /* Flip the left page over to the right (moving backward). */
    function goPrev(cb) {
      if (isTurning || rightIdx <= 1) { if (cb) cb(); return; }
      isTurning = true;
      var flipper = sheets[leftIdx];              // this leaf turns to the right
      var newLeft = leftIdx - 1;                  // revealed underneath on the left
      var turn = makeTurn(-1, flipper);

      setPage(leftEl, sheets[newLeft]);

      requestAnimationFrame(function () {
        requestAnimationFrame(function () { turn.classList.add('turning'); });
      });

      setTimeout(function () {
        setPage(rightEl, flipper);                // flipped leaf lands on the right
        turn.remove();
        leftIdx = newLeft;
        rightIdx = leftIdx + 1;
        isTurning = false;
        refresh();
        if (cb) cb();
      }, FLIP_MS);
    }

    function jumpTo(pageName) {
      var found = -1;
      for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].indexOf('data-page="' + pageName + '"') > -1) { found = i; break; }
      }
      if (found < 0) return;
      if (found === 0) found = 1;
      clearTurn();
      stopAuto();
      leftIdx = Math.max(0, found - 1);
      rightIdx = found;
      setPage(leftEl, sheets[leftIdx]);
      setPage(rightEl, sheets[rightIdx]);
      refresh();
    }

    /* ------- Autoplay: open automatically & turn pages like a real notebook ------- */
    function stopAuto() {
      autoRunning = false;
      if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    }

    function startAuto() {
      stopAuto();
      autoRunning = true;
      function tick() {
        if (!autoRunning) return;
        if (rightIdx >= LAST) { autoRunning = false; return; }
        goNext(function () {
          if (autoRunning) autoTimer = setTimeout(tick, GAP_MS);
        });
      }
      autoTimer = setTimeout(tick, COVER_PAUSE);
    }

    /* ---- Open / close ---- */
    function close() {
      stopAuto();
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (document.exitFullscreen) {
        try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
      }
    }

    function open() {
      stopAuto();
      clearTurn();
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Start the book at the front cover (blank inside-cover + cover spread)
      leftIdx = 0;
      rightIdx = 1;
      setPage(leftEl, sheets[0]);
      setPage(rightEl, sheets[1]);
      refresh();
// Focus management
      setTimeout(function () {
        const f = overlay.querySelector('.rb-nav-arrow, .rb-btn');
        if (f) f.focus();
      }, 50);
    }

    function toggleZoom() {
      stage.classList.toggle('zoomed');
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        overlay.requestFullscreen && overlay.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    }

    /* Event wiring */
    if (prevBtn) prevBtn.addEventListener('click', function () { stopAuto(); goPrev(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stopAuto(); goNext(); });
    if (zoomBtn) zoomBtn.addEventListener('click', toggleZoom);
    if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (downloadBtn) downloadBtn.addEventListener('click', function () {
      if (data.personal && data.personal.resumePdf) {
        const a = document.createElement('a');
        a.href = data.personal.resumePdf;
        a.setAttribute('download', '');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
    if (tocWrap) tocWrap.addEventListener('click', function (e) { e.stopPropagation(); });

    /* TOC */
    if (tocBtn && tocWrap && tocMenu) {
      tocBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        tocWrap.classList.toggle('open');
      });
      document.addEventListener('click', function (e) {
        if (!tocWrap.contains(e.target)) tocWrap.classList.remove('open');
      });
      tocMenu.querySelectorAll('[data-jump]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          jumpTo(btn.getAttribute('data-jump'));
          tocWrap.classList.remove('open');
        });
      });
    }

    /* Keyboard */
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Escape') { close(); }
    });

    /* Touch / swipe */
    let startX = 0, startY = 0;
    overlay.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    overlay.addEventListener('touchend', function (e) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) goNext();
        else goPrev();
      }
    }, { passive: true });

    /* Provide public API */
    overlay.open = open;
    overlay.close = close;
    overlay.goNext = goNext;
    overlay.goPrev = goPrev;
    overlay.jumpTo = jumpTo;

    refresh();
  }

  /* ---------- Create the overlay DOM ---------- */
  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'resume-book-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Digital Resume Book');

    const bar = document.createElement('div');
    bar.className = 'resume-book-bar';
    bar.innerHTML = `
      <div class="rb-title"><i class="fas fa-book-open"></i><span>My Resume — Interactive Book</span></div>
      <div class="rb-controls">
        <button type="button" class="rb-btn" data-action="zoom" aria-label="Toggle zoom" title="Zoom"><i class="fas fa-search-plus"></i></button>
        <button type="button" class="rb-btn" data-action="fullscreen" aria-label="Toggle fullscreen" title="Fullscreen"><i class="fas fa-expand"></i></button>
        <button type="button" class="rb-btn rb-primary" data-action="download" aria-label="Download PDF resume" title="Download PDF"><i class="fas fa-file-pdf"></i><span>PDF</span></button>
        <button type="button" class="rb-btn" data-action="close" aria-label="Close resume book" title="Close (Esc)"><i class="fas fa-times"></i></button>
      </div>
    `;

    const stage = document.createElement('div');
    stage.className = 'resume-book-stage';
    const book = document.createElement('div');
    book.className = 'resume-book';
    stage.appendChild(book);

    const nav = document.createElement('div');
    nav.className = 'resume-book-nav';
    nav.innerHTML = `
      <button type="button" class="rb-nav-arrow" data-nav="prev" aria-label="Previous page"><i class="fas fa-chevron-left"></i> Previous</button>
      <div class="rb-toc-wrap">
        <button type="button" class="rb-nav-arrow" data-action="toc" aria-label="Open table of contents"><i class="fas fa-list-ul"></i></button>
        <div class="rb-toc-menu" role="menu">
          <button data-jump="about">About</button>
          <button data-jump="education">Education</button>
          <button data-jump="skills">Skills</button>
          <button data-jump="experience">Experience</button>
          <button data-jump="projects">Projects</button>
          <button data-jump="certifications">Certifications</button>
          <button data-jump="achievements">Achievements</button>
          <button data-jump="tools">Tools</button>
          <button data-jump="contact">Contact</button>
        </div>
      </div>
      <span class="rb-page-indicator" aria-live="polite">Cover</span>
      <button type="button" class="rb-nav-arrow" data-nav="next" aria-label="Next page">Next <i class="fas fa-chevron-right"></i></button>
    `;

    overlay.appendChild(bar);
    overlay.appendChild(stage);
    overlay.appendChild(nav);
    document.body.appendChild(overlay);

    initBook(overlay, buildPages());
    return overlay;
  }

/* ---------- Entry point wiring ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    let overlay = document.querySelector('.resume-book-overlay');
    if (!overlay) overlay = buildOverlay();

    // Wire all buttons that open the resume book
    document.querySelectorAll('[data-open-resume]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (overlay.open) overlay.open();
      });
    });

});

// Expose global API (in case it's needed later)
  window.ResumeBook = {
    open: function () {
      const el = document.querySelector('.resume-book-overlay');
      if (el && el.open) el.open();
    },
    showPDF: function () {
      const panel = document.querySelector('.resume-pdf-panel');
      const toggleBtns = document.querySelectorAll('.rb-toggle-btn');
      if (panel) panel.classList.add('active');
      toggleBtns.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-view') === 'pdf');
      });
    },
    showDigital: function () {
      const panel = document.querySelector('.resume-pdf-panel');
      const toggleBtns = document.querySelectorAll('.rb-toggle-btn');
      if (panel) panel.classList.remove('active');
      toggleBtns.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-view') === 'digital');
      });
      window.ResumeBook.open();
    }
  };

/* ---------- Resume view toggle (Digital <-> PDF) ---------- */
  function initViewToggle() {
    const toggleBtns = document.querySelectorAll('.rb-toggle-btn');
    if (!toggleBtns.length) return;

    toggleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const view = btn.getAttribute('data-view');
        if (view === 'pdf') {
          window.ResumeBook.showPDF();
        } else {
          window.ResumeBook.showDigital();
        }
      });
    });

    // Hide the loading overlay once the PDF iframe finishes loading.
    const pdfIframe = document.querySelector('.resume-pdf-frame iframe');
    if (pdfIframe) {
      pdfIframe.addEventListener('load', function () {
        const loading = document.querySelector('.resume-pdf-frame .rb-pdf-loading');
        if (loading) loading.classList.add('hidden');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initViewToggle();
  });
})();
