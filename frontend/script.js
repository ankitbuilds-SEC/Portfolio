/* ==========================================
   PORTFOLIO JAVASCRIPT
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const apiBase = window.__API_BASE__ || (window.location.hostname === "localhost" ? "http://localhost:3000" : window.location.origin);
    /* ===============================
       Smooth Scroll
    =============================== */

    const navLinks = document.querySelectorAll('nav a');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('nav');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('menu-open', isOpen);
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
            });
        });

        document.addEventListener('click', (event) => {
            if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) {
                navMenu.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('menu-open');
            }
        });
    }

    navLinks.forEach(link => {

        link.addEventListener("click", function (e) {

            e.preventDefault();

            const target = document.querySelector(this.getAttribute("href"));

            if (target) {

                target.scrollIntoView({

                    behavior: "smooth"

                });

            }

        });

    });

    /* ===============================
       Active Navigation
    =============================== */

    const sections = document.querySelectorAll("section");

    window.addEventListener("scroll", () => {

        let current = "";

        sections.forEach(section => {

            const sectionTop = section.offsetTop - 150;

            if (scrollY >= sectionTop) {

                current = section.getAttribute("id");

            }

        });

        navLinks.forEach(link => {

            link.classList.remove("active");

            if (link.getAttribute("href") === "#" + current) {

                link.classList.add("active");

            }

        });

    });

    /* ===============================
       Sticky Navbar Shadow
    =============================== */

    const header = document.querySelector("header");

    window.addEventListener("scroll", () => {

        if (window.scrollY > 50) {

            header.style.boxShadow = "0 10px 30px rgba(112, 28, 43, .08)";

        }

        else {

            header.style.boxShadow = "none";

        }

    });

    /* Keep the hero label aligned with the modern portfolio direction. */

    const typingElement = document.querySelector(".hero-content h3");
    if (typingElement) {
        typingElement.textContent = "Full Stack & AI";
    }

    /* ===============================
       Scroll Reveal
    =============================== */

    const revealElements = document.querySelectorAll(

".reveal, .reveal-left, .reveal-right, .project-card, .certificate-card, .gallery-item, .hobby-card, .blog-card"

    );

    function reveal() {

        revealElements.forEach(element => {

            const windowHeight = window.innerHeight;

            const revealTop = element.getBoundingClientRect().top;

            const revealPoint = 100;

            if (revealTop < windowHeight - revealPoint) {

                element.style.opacity = "1";

                element.style.transform = "translateY(0px)";

            }

        });

    }

    revealElements.forEach(el => {

        el.style.opacity = "0";

        el.style.transform = "translateY(50px)";

        el.style.transition = ".8s";

    });

    window.addEventListener("scroll", reveal);

    window.addEventListener("load", reveal, { once: true });

    reveal();

    requestAnimationFrame(reveal);

    /* ===============================
       Project and Certificate Filters
    =============================== */

    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {

        button.addEventListener('click', () => {

            const filter = button.getAttribute('data-filter');

            filterButtons.forEach(btn => btn.classList.remove('active'));

            button.classList.add('active');

            const cards = document.querySelectorAll(
                button.closest('section').id === 'projects' ? '.project-card' : '.certificate-card'
            );

            cards.forEach(card => {

                const category = card.getAttribute('data-category');

                if (filter === 'all' || category === filter) {

                    card.classList.remove('hidden');

                }

                else {

                    card.classList.add('hidden');

                }

            });

        });

    });

    /* ===============================
       FAQ Toggle
    =============================== */

    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {

        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {

            faqItems.forEach(entry => entry.classList.remove('active'));

            item.classList.add('active');

        });

    });

    /* ===============================
       Contact Form Validation
    =============================== */

    const form = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const subjectInput = document.getElementById("subject");
    const messageInput = document.getElementById("message");
    const submitBtn = document.getElementById("submitBtn");
    let isSubmitting = false;

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate email format
    function isValidEmail(email) {
      return emailRegex.test(email) && email.length <= 255;
    }

    // Show error message
    function showError(message) {
      formStatus.textContent = message;
      formStatus.style.color = "#E63946";
      formStatus.style.marginTop = "12px";
    }

    // Show success message
    function showSuccess(message) {
      formStatus.textContent = message;
      formStatus.style.color = "#B5122A";
      formStatus.style.marginTop = "12px";
    }

    // Reset status message
    function clearStatus() {
      formStatus.textContent = "";
      formStatus.style.color = "";
    }

    // Client-side validation
    function validateForm() {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const subject = subjectInput.value.trim();
      const message = messageInput.value.trim();

      if (!name || name.length === 0) {
        showError("Please enter your name.");
        return false;
      }

      if (name.length > 100) {
        showError("Name must be less than 100 characters.");
        return false;
      }

      if (!email || email.length === 0) {
        showError("Please enter your email address.");
        return false;
      }

      if (!isValidEmail(email)) {
        showError("Please enter a valid email address.");
        return false;
      }

      if (!subject || subject.length === 0) {
        showError("Please enter a subject.");
        return false;
      }

      if (subject.length > 200) {
        showError("Subject must be less than 200 characters.");
        return false;
      }

      if (!message || message.length === 0) {
        showError("Please enter your message.");
        return false;
      }

      if (message.length > 5000) {
        showError("Message must be less than 5000 characters.");
        return false;
      }

      return true;
    }

    if (form && nameInput && emailInput && subjectInput && messageInput && submitBtn) {

      form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Prevent duplicate submissions
        if (isSubmitting) {
          return;
        }

        // Validate form
        if (!validateForm()) {
          return;
        }

        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.6";
        submitBtn.style.cursor = "not-allowed";
        clearStatus();

        const payload = {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          subject: subjectInput.value.trim(),
          message: messageInput.value.trim(),
          honeypot: document.querySelector('.honeypot')?.value || ""
        };

        try {
          showStatus("Sending your message...", "#E63946");
          
          const response = await fetch(`${apiBase}/api/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            timeout: 10000
          });

          let data = {};
          try {
            data = await response.json();
          } catch (jsonError) {
            data = { error: "Invalid response from server" };
          }

          if (!response.ok) {
            const errorMessage = data.error || "Failed to send message. Please try again.";
            showError(errorMessage);
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            submitBtn.style.cursor = "pointer";
            return;
          }

          showSuccess("✓ Message sent successfully! I'll get back to you soon.");
          
          // Clear form after success
          form.reset();
          
          // Re-enable button after delay
          setTimeout(() => {
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            submitBtn.style.cursor = "pointer";
            clearStatus();
          }, 3000);

        } catch (error) {
          console.error('Submission error:', error);
          showError("Network error. Please check your connection and try again.");
          isSubmitting = false;
          submitBtn.disabled = false;
          submitBtn.style.opacity = "1";
          submitBtn.style.cursor = "pointer";
        }
      });

    }

    function showStatus(message, color) {
      formStatus.textContent = message;
      formStatus.style.color = color;
      formStatus.style.marginTop = "12px";
    }

    /* ===============================
       Scroll To Top Button
    =============================== */

    const topButton = document.getElementById("back-to-top");
    const footerYear = document.getElementById("year");

    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    if (topButton) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 500) {
                topButton.classList.add("visible");
            } else {
                topButton.classList.remove("visible");
            }
        });

        topButton.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

/* ===============================
       Live Location Map
    =============================== */

    const mapEl = document.getElementById('live-map');
    const locationStatus = document.getElementById('locationStatus');
    const statusTextEl = locationStatus ? locationStatus.querySelector('.loc-status-text') : null;
    const locLatEl = document.getElementById('locLat');
    const locLngEl = document.getElementById('locLng');
    const locAccEl = document.getElementById('locAcc');
    const locTimeEl = document.getElementById('locTime');
    const shareBtn = document.getElementById('loc-share-btn');
    const shareBtnText = shareBtn ? shareBtn.querySelector('span') : null;
    const locHintEl = document.getElementById('locHint');

    // Owner mode: persisted in localStorage so a single opt-in remembers the
    // user as broadcaster on later visits. ?owner=1 remains a manual override.
    const OWNER_KEY = 'portfolio_owner_mode';
    let isOwner = new URLSearchParams(window.location.search).has('owner');
    if (isOwner) {
      try { localStorage.setItem(OWNER_KEY, '1'); } catch (e) {}
    } else {
      try { isOwner = localStorage.getItem(OWNER_KEY) === '1'; } catch (e) {}
    }

    // Geolocation only works in a secure context (HTTPS or localhost).
    const secureContext = window.isSecureContext;
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    function setStatus(message, state) {
      if (!locationStatus || !statusTextEl) return;
      statusTextEl.textContent = message;
      locationStatus.classList.remove('live', 'error', 'searching');
      if (state) locationStatus.classList.add(state);
    }

    function formatTime(isoOrStr) {
      if (!isoOrStr) return '—';
      const d = new Date(isoOrStr);
      if (isNaN(d.getTime())) return isoOrStr;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' · ' + d.toLocaleDateString();
    }

    function updateMap(map, marker, accuracyCircle, lat, lng, accuracy, updatedAt) {
      if (map && marker) {
        marker.setLatLng([lat, lng]);
        marker.bindPopup('📍 Ankit\'s live location').closeTooltip();
        if (accuracyCircle) accuracyCircle.setLatLng([lat, lng]);
        map.setView([lat, lng], map.getZoom() >= 15 ? map.getZoom() : 15, { animate: true });
      }
      if (locLatEl) locLatEl.textContent = lat.toFixed(6);
      if (locLngEl) locLngEl.textContent = lng.toFixed(6);
      if (locAccEl) locAccEl.textContent = accuracy ? `±${Math.round(accuracy)} m` : '—';
      if (locTimeEl) locTimeEl.textContent = formatTime(updatedAt);
    }

    function createPortfolioMapMarker(lat, lng) {
      const icon = L.divIcon({
        className: 'portfolio-map-marker-icon',
        html: '<span aria-hidden="true"></span>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      return L.marker([lat, lng], { icon });
    }

    function createBaseMap(lat, lng, zoom) {
      const map = L.map(mapEl, { scrollWheelZoom: false }).setView([lat, lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      const marker = createPortfolioMapMarker(lat, lng).addTo(map);
      const accuracyCircle = L.circle([lat, lng], { radius: 100, color: '#E63946', fillColor: '#F4A6B8', fillOpacity: 0.1 }).addTo(map);
      return { map, marker, accuracyCircle };
    }

    function setShareUi(active) {
      if (!shareBtn || !shareBtnText) return;
      if (active) {
        shareBtn.classList.add('is-active');
        shareBtnText.textContent = 'Stop sharing my location';
        if (locHintEl) locHintEl.textContent = 'Sharing live — updates stop when this page is closed.';
      } else {
        shareBtn.classList.remove('is-active');
        shareBtnText.textContent = 'Share my live location';
        if (locHintEl) locHintEl.textContent = 'Your location is shared only while this page is open.';
      }
    }

    // Holds a reference to the currently displayed map + marker so the
    // visitor poller can update the live marker as the broadcast moves.
    const currentViewerMap = { map: null, marker: null, accuracyCircle: null };

    // Visitor fallback: if there is no broadcast, show the visitor's own
    // location with a note, so the map never just sits empty.
    function initViewerMap(location) {
      if (!mapEl || typeof L === 'undefined') return;

      const showVisitorLocation = () => {
        if (!navigator.geolocation) {
          setStatus('No broadcast — geolocation unsupported', 'searching');
          return;
        }
        setStatus('No broadcast yet — showing your location', 'searching');
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          if (!mapEl._leaflet_id) {
            const base = createBaseMap(latitude, longitude, 15);
            base.map._locViewer = true;
            base.map._locOwned = false;
            base.marker.bindPopup('📍 Your location (no broadcast available)').openPopup();
            currentViewerMap.map = base.map;
            currentViewerMap.marker = base.marker;
            currentViewerMap.accuracyCircle = base.accuracyCircle;
            updateMap(base.map, base.marker, base.accuracyCircle, latitude, longitude, accuracy, new Date().toISOString());
            setStatus('Showing your location', 'live');
          }
        }, (err) => {
          setStatus('No broadcast and no location access', 'error');
        }, { enableHighAccuracy: true, timeout: 15000 });
      };

      if (location) {
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lng);
        const base = createBaseMap(lat, lng, 13);
        base.map._locViewer = true;
        base.map._locOwned = false;
        base.marker.bindPopup('📍 Ankit\'s live location').openPopup();
        currentViewerMap.map = base.map;
        currentViewerMap.marker = base.marker;
        currentViewerMap.accuracyCircle = base.accuracyCircle;
        updateMap(base.map, base.marker, base.accuracyCircle, lat, lng, location.accuracy, location.updated_at);
        setStatus('Live location updated', 'live');
      } else {
        showVisitorLocation();
      }

      // Poll the latest broadcast location periodically for visitors.
      let lastLat = location ? parseFloat(location.lat) : null;
      let lastLng = location ? parseFloat(location.lng) : null;
      setInterval(async () => {
        try {
          const res = await fetch(`${apiBase}/api/location/latest`);
          const data = await res.json();
          const loc = data && data.location;
          if (loc && loc.lat != null && loc.lng != null) {
            const newLat = parseFloat(loc.lat);
            const newLng = parseFloat(loc.lng);
            const moved = lastLat == null || Math.abs(newLat - lastLat) > 0.00001 || Math.abs(newLng - lastLng) > 0.00001;
            if (moved) {
              lastLat = newLat;
              lastLng = newLng;
              if (!mapEl._leaflet_id) {
                // A broadcast became available after the fallback was shown.
                const base = createBaseMap(newLat, newLng, 15);
                base.map._locViewer = true;
                base.map._locOwned = false;
                base.marker.bindPopup('📍 Ankit\'s live location').openPopup();
                currentViewerMap.map = base.map;
                currentViewerMap.marker = base.marker;
                currentViewerMap.accuracyCircle = base.accuracyCircle;
                updateMap(base.map, base.marker, base.accuracyCircle, newLat, newLng, loc.accuracy, loc.updated_at);
              } else if (currentViewerMap.marker) {
                updateMap(currentViewerMap.map, currentViewerMap.marker, currentViewerMap.accuracyCircle, newLat, newLng, loc.accuracy, loc.updated_at);
              }
              setStatus('Live location updated', 'live');
            }
          }
        } catch (e) {
          // ignore transient errors
        }
      }, 10000);
    }

    async function startBroadcast() {
      if (!navigator.geolocation) {
        setStatus('Geolocation is not supported by your browser', 'error');
        return;
      }
      if (!secureContext && !isLocalhost) {
        setStatus('Location requires HTTPS (or localhost) to work', 'error');
        return;
      }

      try {
        const session = await fetch(`${apiBase}/api/admin/session`, { credentials: 'same-origin' });
        if (!session.ok) {
          setStatus(
            session.status === 503
              ? 'Administrator authentication is not configured.'
              : 'Sign in at /admin before sharing your live location.',
            'error'
          );
          setShareUi(false);
          isOwner = false;
          try { localStorage.removeItem(OWNER_KEY); } catch (e) {}
          return;
        }
      } catch (error) {
        setStatus('Unable to verify administrator access. Please try again.', 'error');
        setShareUi(false);
        isOwner = false;
        try { localStorage.removeItem(OWNER_KEY); } catch (e) {}
        return;
      }

      setStatus('Acquiring live location…', 'searching');
      setShareUi(true);
      try { localStorage.setItem(OWNER_KEY, '1'); } catch (e) {}
      isOwner = true;

      let map = null;
      let marker = null;
      let accuracyCircle = null;
      let lastSent = 0;
      let requestPending = false;
      let watchId = null;

      function onPosition(pos) {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        const now = Date.now();

        if (!map) {
          map = L.map(mapEl, { scrollWheelZoom: false }).setView([latitude, longitude], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          marker = createPortfolioMapMarker(latitude, longitude).addTo(map);
          marker.bindPopup('📍 You are here (owner)').openPopup();
          accuracyCircle = L.circle([latitude, longitude], { radius: accuracy || 100, color: '#B5122A', fillColor: '#F4A6B8', fillOpacity: 0.12 }).addTo(map);
          currentViewerMap.map = map;
          currentViewerMap.marker = marker;
          currentViewerMap.accuracyCircle = accuracyCircle;
        } else {
          marker.setLatLng([latitude, longitude]);
          accuracyCircle.setLatLng([latitude, longitude]).setRadius(accuracy || 100);
          map.setView([latitude, longitude], 15, { animate: true });
        }

        // Throttle broadcasting to at most once every 3 seconds.
        if (now - lastSent > 3000 && !requestPending) {
          lastSent = now;
          requestPending = true;
          fetch(`${apiBase}/api/location`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lng: longitude, accuracy, heading, speed })
          }).then((response) => {
            if (response.status === 401) {
              throw new Error('Administrator session expired. Sign in again at /admin.');
            }
            if (!response.ok) {
              throw new Error('Unable to share live location. Please try again.');
            }
            setStatus('Broadcasting live location', 'live');
          }).catch((error) => {
            setStatus(error.message || 'Unable to share live location.', 'error');
            setShareUi(false);
            isOwner = false;
            try { localStorage.removeItem(OWNER_KEY); } catch (e) {}
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          }).finally(() => {
            requestPending = false;
          });
        }

        updateMap(map, marker, accuracyCircle, latitude, longitude, accuracy, new Date().toISOString());
        if (lastSent === 0) setStatus('Location acquired; waiting to publish…', 'searching');
      }

      function onError(err) {
        let msg = 'Location unavailable';
        if (err.code === err.PERMISSION_DENIED) msg = 'Location permission denied';
        else if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location unavailable';
        else if (err.code === err.TIMEOUT) msg = 'Location request timed out';
        setStatus(msg, 'error');
        setShareUi(false);
        try { localStorage.removeItem(OWNER_KEY); } catch (e) {}
      }

      watchId = navigator.geolocation.watchPosition(onPosition, onError, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000
      });
    }

    function stopBroadcast() {
      try { localStorage.removeItem(OWNER_KEY); } catch (e) {}
      isOwner = false;
      setShareUi(false);
      setStatus('Location sharing stopped', 'searching');
      // Reload viewer so it shows the last broadcast (if any) or fallback.
      window.location.reload();
    }

    if (mapEl) {
      if (shareBtn) {
        shareBtn.addEventListener('click', () => {
          if (isOwner) {
            stopBroadcast();
          } else {
            startBroadcast();
          }
        });
      }

      if (isOwner) {
        // Owner: track device and broadcast live location.
        startBroadcast();
      } else {
        // Visitor: fetch and display the latest broadcast location.
        (async () => {
          let location = null;
          try {
            const res = await fetch(`${apiBase}/api/location/latest`);
            const data = await res.json();
            location = data && data.location ? data.location : null;
          } catch (e) {
            location = null;
          }
          initViewerMap(location);
        })();
      }
    }

    /* ===============================
       Footer Year
    =============================== */

    const footer = document.querySelector("footer p");

    if (footer) {

        footer.innerHTML =

            `© ${new Date().getFullYear()} Ankit Kumar | All Rights Reserved`;

    }

    /* ===============================
       Project Hover Effect
    =============================== */

    const projects = document.querySelectorAll(".project-card");

    projects.forEach(project => {

        project.addEventListener("mouseenter", () => {

            project.style.transform =

                "translateY(-10px) scale(1.02)";

        });

        project.addEventListener("mouseleave", () => {

            project.style.transform =

                "translateY(0px) scale(1)";

        });

    });

/* ===============================
       Gallery Lightbox
    =============================== */

    const galleryItems = document.querySelectorAll('.gallery-item');

    if (galleryItems.length > 0) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.setAttribute('aria-label', 'Image lightbox');

        const lightboxImg = document.createElement('img');
        const lightboxCaption = document.createElement('p');
        lightboxCaption.className = 'lightbox-caption';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'lightbox-close';
        closeBtn.setAttribute('aria-label', 'Close lightbox');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'lightbox-nav lightbox-prev';
        prevBtn.setAttribute('aria-label', 'Previous image');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'lightbox-nav lightbox-next';
        nextBtn.setAttribute('aria-label', 'Next image');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';

        lightbox.appendChild(closeBtn);
        lightbox.appendChild(prevBtn);
        lightbox.appendChild(nextBtn);
        lightbox.appendChild(lightboxImg);
        lightbox.appendChild(lightboxCaption);
        document.body.appendChild(lightbox);

        let currentIndex = 0;

        function openLightbox(index) {
            currentIndex = (index + galleryItems.length) % galleryItems.length;
            const item = galleryItems[currentIndex];
            const img = item.querySelector('img');
            const caption = item.getAttribute('data-caption') || 'Campus Life';
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCaption.textContent = caption;
            lightbox.classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('open');
            document.body.style.overflow = '';
        }

        function showImage(direction) {
            openLightbox(currentIndex + direction);
        }

        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => openLightbox(index));
        });

        closeBtn.addEventListener('click', closeLightbox);

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(-1);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(1);
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('open')) return;
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                showImage(-1);
            } else if (e.key === 'ArrowRight') {
                showImage(1);
            }
        });
    }

    /* ===============================
       Featured Projects
    =============================== */

    /** @type {Array<{ title: string, description: string, technologyStack: string[], thumbnail?: string, githubUrl?: string, liveDemoUrl?: string, category?: string }>} */
    const projectRecords = [];

    function safeProjectUrl(value) {
        if (typeof value !== 'string' || !value.trim()) return '';

        try {
            const url = new URL(value, window.location.href);
            return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
        } catch (error) {
            return '';
        }
    }

    function renderProjects() {
        const grid = document.getElementById('projectGrid');
        const emptyState = document.getElementById('projectsEmptyState');
        const template = document.getElementById('projectCardTemplate');
        if (!grid || !emptyState || !template) return;

        const cards = projectRecords
            .filter(project => project && typeof project.title === 'string' && project.title.trim()
                && typeof project.description === 'string' && project.description.trim())
            .map(project => {
                const card = document.importNode(template.content, true);
                const title = card.querySelector('[data-project-title]');
                const description = card.querySelector('[data-project-description]');
                const category = card.querySelector('[data-project-category]');
                const thumbnail = card.querySelector('[data-project-thumbnail]');
                const image = card.querySelector('[data-project-thumbnail-image]');
                const stack = card.querySelector('[data-project-stack]');
                const githubLink = card.querySelector('[data-project-github]');
                const demoLink = card.querySelector('[data-project-demo]');

                title.textContent = project.title.trim();
                description.textContent = project.description.trim();

                if (project.category && typeof project.category === 'string') {
                    category.textContent = project.category.trim();
                    category.hidden = !category.textContent;
                }

                const thumbnailUrl = safeProjectUrl(project.thumbnail);
                if (thumbnailUrl) {
                    image.src = thumbnailUrl;
                    image.alt = `${project.title.trim()} project preview`;
                    thumbnail.hidden = false;
                }

                if (Array.isArray(project.technologyStack)) {
                    project.technologyStack
                        .filter(technology => typeof technology === 'string' && technology.trim())
                        .forEach(technology => {
                            const tag = document.createElement('li');
                            tag.textContent = technology.trim();
                            stack.appendChild(tag);
                        });
                }

                const githubUrl = safeProjectUrl(project.githubUrl);
                if (githubUrl) {
                    githubLink.href = githubUrl;
                    githubLink.hidden = false;
                }

                const liveDemoUrl = safeProjectUrl(project.liveDemoUrl);
                if (liveDemoUrl) {
                    demoLink.href = liveDemoUrl;
                    demoLink.hidden = false;
                }

                return card;
            });

        grid.replaceChildren(...cards);
        emptyState.hidden = cards.length > 0;
    }

    renderProjects();

    /* ===============================
       Education Section
    =============================== */

    async function renderEducationSection() {
        const grid = document.getElementById('educationGrid');
        const empty = document.getElementById('educationEmpty');

        if (!grid) return;

        try {
            const response = await fetch(`${apiBase}/api/education`);
            if (!response.ok) {
                throw new Error('Unable to load education data');
            }

            const records = await response.json();
            if (!Array.isArray(records) || records.length === 0) {
                grid.innerHTML = '';
                if (empty) empty.hidden = false;
                return;
            }

            if (empty) empty.hidden = true;

            grid.innerHTML = records.map((record) => {
                const startYear = record.start_year || '—';
                const endYear = record.end_year || (record.status === 'Pursuing' ? 'Expected' : '—');
                const grade = record.grade ? `<div class="edu-stat"><span>Grade</span><strong>${record.grade}</strong></div>` : '';
                const location = record.location ? `<div class="edu-stat"><span>Location</span><strong>${record.location}</strong></div>` : '';
                const coursework = record.coursework ? `<p class="edu-extra"><strong>Coursework:</strong> ${record.coursework}</p>` : '';
                const achievements = record.achievements ? `<p class="edu-extra"><strong>Achievements:</strong> ${record.achievements}</p>` : '';
                const description = record.description ? `<p class="edu-summary">${record.description}</p>` : '';

                return `
                    <article class="education-card">
                        <div class="education-header">
                            <div>
                                <span class="education-status ${record.status.toLowerCase().replace(/\s+/g, '-')}">${record.status}</span>
                                <h3>${record.degree}</h3>
                            </div>
                            <span class="education-period">${startYear} — ${endYear}</span>
                        </div>
                        <p class="education-institution">${record.institution}</p>
                        ${record.college ? `<p class="education-college">${record.college}</p>` : ''}
                        ${record.field_of_study ? `<p class="education-field">${record.field_of_study}</p>` : ''}
                        ${description}
                        <div class="education-meta">
                            ${grade}
                            ${location}
                        </div>
                        ${coursework}
                        ${achievements}
                    </article>
                `;
            }).join('');
        } catch (error) {
            console.error('Education load failed:', error);
            if (empty) empty.hidden = false;
            grid.innerHTML = '<p class="education-error">Education information is temporarily unavailable.</p>';
        }
    }

    renderEducationSection();

    /* ===============================
       Portfolio AI Assistant
    =============================== */

    function createPortfolioAssistant() {
        if (document.getElementById('portfolio-chatbot')) {
            return;
        }

        const chatbot = document.createElement('div');
        chatbot.id = 'portfolio-chatbot';
        chatbot.className = 'portfolio-chatbot';

        chatbot.innerHTML = `
            <button class="chatbot-toggle" type="button" aria-label="Open portfolio assistant">
                <i class="fas fa-robot"></i>
                <span class="chatbot-badge">AI</span>
            </button>
            <div class="chatbot-panel" aria-live="polite" aria-label="Portfolio assistant chat window" hidden>
                <div class="chatbot-header">
                    <div>
                        <strong>Portfolio AI Assistant</strong>
                        <small>Portfolio helper</small>
                    </div>
                    <button type="button" class="chatbot-close" aria-label="Close assistant"><i class="fas fa-times"></i></button>
                </div>

                <div class="chatbot-messages"></div>

                <div class="chatbot-quick-questions">
                    <button type="button" class="quick-question">Tell me about your education.</button>
                    <button type="button" class="quick-question">What technologies do you work with?</button>
                    <button type="button" class="quick-question">What are your Generative AI interests?</button>
                    <button type="button" class="quick-question">What projects are available?</button>
                    <button type="button" class="quick-question">How can I contact you?</button>
                </div>

                <form class="chatbot-form">
                    <input type="text" class="chatbot-input" aria-label="Type your question" placeholder="Ask about projects, education, skills, or interests..." autocomplete="off" maxlength="2000" />
                    <button type="submit" class="chatbot-send">Send</button>
                </form>
            </div>
        `;

        document.body.appendChild(chatbot);

        const toggle = chatbot.querySelector('.chatbot-toggle');
        const panel = chatbot.querySelector('.chatbot-panel');
        const closeBtn = chatbot.querySelector('.chatbot-close');
        const form = chatbot.querySelector('.chatbot-form');
        const input = chatbot.querySelector('.chatbot-input');
        const messages = chatbot.querySelector('.chatbot-messages');
        const sendButton = chatbot.querySelector('.chatbot-send');
        const quickQuestions = chatbot.querySelectorAll('.quick-question');
        let isRequestPending = false;

        const addMessage = (sender, text) => {
            const msg = document.createElement('div');
            msg.className = `chat-message ${sender}`;
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            const messageText = document.createElement('span');
            messageText.textContent = text;
            bubble.appendChild(messageText);

            const timestamp = document.createElement('small');
            timestamp.textContent = time;
            bubble.appendChild(timestamp);
            msg.appendChild(bubble);
            messages.appendChild(msg);
            messages.scrollTop = messages.scrollHeight;
        };

        const setTyping = (isTyping) => {
            const typingEl = chatbot.querySelector('.chatbot-typing');
            if (isTyping) {
                if (!typingEl) {
                    const el = document.createElement('div');
                    el.className = 'chat-message bot chatbot-typing';
                    el.innerHTML = '<div class="bubble"><span>Typing...</span></div>';
                    messages.appendChild(el);
                }
                return;
            }

            if (typingEl) typingEl.remove();
        };

        const askAssistant = async (question) => {
            if (!question.trim() || isRequestPending) return;
            isRequestPending = true;
            addMessage('user', question.trim());
            setTyping(true);
            sendButton.disabled = true;
            quickQuestions.forEach(button => {
                button.disabled = true;
            });

            try {
                const response = await fetch(`${apiBase}/api/chatbot/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: question.trim() })
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.error || 'The assistant could not process your message. Please try again.');
                }
                if (typeof data.answer !== 'string' || !data.answer.trim()) {
                    throw new Error('The assistant returned an empty response. Please try again.');
                }
                setTyping(false);
                addMessage('bot', data.answer);
            } catch (error) {
                setTyping(false);
                const message = error.message === 'Failed to fetch'
                    ? 'The assistant is temporarily unavailable. Please use the contact form or public links to reach out.'
                    : error.message || 'The assistant is temporarily unavailable. Please try again.';
                addMessage('bot', message);
            } finally {
                isRequestPending = false;
                sendButton.disabled = false;
                quickQuestions.forEach(button => {
                    button.disabled = false;
                });
            }
        };

        const openChat = () => {
            panel.hidden = false;
            input.focus();
        };

        toggle.addEventListener('click', () => {
            panel.hidden = !panel.hidden;
            if (!panel.hidden) input.focus();
        });

        closeBtn.addEventListener('click', () => {
            panel.hidden = true;
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const question = input.value.trim();
            if (!question) return;
            input.value = '';
            askAssistant(question);
        });

        chatbot.querySelectorAll('.quick-question').forEach((button) => {
            button.addEventListener('click', () => {
                openChat();
                askAssistant(button.textContent.trim());
            });
        });

        addMessage('bot', 'Hi! 👋 I\'m your AI Portfolio Assistant. I can help you explore my published projects, education, skills, development interests, and professional background. What would you like to know?');
    }

    createPortfolioAssistant();

    /* ===============================
       Theme Toggle
    =============================== */

    const savedTheme = window.PortfolioUtils?.getTheme?.() || 'light';
    const toggle = document.querySelector('.theme-toggle-nav');

    if (toggle) {
        window.PortfolioUtils?.setTheme?.(savedTheme);
        toggle.innerHTML = savedTheme === 'dark' ? '🌙' : '☀';
        toggle.addEventListener('click', () => {
            const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            window.PortfolioUtils?.setTheme?.(nextTheme);
            toggle.innerHTML = nextTheme === 'dark' ? '🌙' : '☀';
        });
    }

});

/* ==========================================
   END OF FILE
========================================== */