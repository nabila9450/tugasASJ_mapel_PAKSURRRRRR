/* =========================================================
   PRAKTIKUM ASJ - VirtualBox & Debian
   ========================================================= */

(function () {
    const $ = (s, el = document) => el.querySelector(s);
    const hasGsap = typeof window.gsap !== 'undefined';
    const hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== 'undefined';
    const hasLenis = typeof window.Lenis !== 'undefined';

    /* ---------- 1. LOADER ---------- */
    const loader = $('#loader');
    const bar = $('#loader-bar');

    function hideLoader() {
        if (!loader || loader.dataset.done) return;
        loader.dataset.done = '1';
        if (hasGsap) {
            gsap.to(loader, {
                autoAlpha: 0, duration: 0.7, ease: 'power2.inOut',
                onComplete: () => loader.remove()
            });
            gsap.from('.hero-text > *', { y: 40, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.2 });
            gsap.from('.stage', { y: 50, autoAlpha: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 });
        } else {
            loader.remove();
        }
    }

    if (hasGsap) {
        gsap.to(bar, { width: '100%', duration: 1.2, ease: 'power2.inOut', onComplete: hideLoader });
    } else {
        setTimeout(hideLoader, 600);
    }
    // loader akan hilang setelah 4 detik
    setTimeout(hideLoader, 4000);

    /* ---------- 2. SMOOTH SCROLL + PROGRESS ---------- */
    const progress = $('#scroll-progress');
    const header = $('#site-header');
    let lenis = null;

    function onScroll() {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY || document.documentElement.scrollTop;
        if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        if (header) header.classList.toggle('scrolled', y > 30);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (hasLenis) {
        lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
        if (hasScrollTrigger) {
            gsap.registerPlugin(ScrollTrigger);
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
        } else {
            const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
            requestAnimationFrame(raf);
        }
    } else if (hasScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Klik menu -> scroll halus 
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
            else target.scrollIntoView({ behavior: 'smooth' });
            nav.classList.remove('open');
        });
    });

    /* ---------- 3. MENU MOBILE ---------- */
    const nav = $('#nav');
    const menuBtn = $('#menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', () => nav.classList.toggle('open'));

    /* ---------- 4. KARTU NAMA KELOMPOK (interaktif) ---------- */
    const viewport = $('#nc-viewport');
    const track = $('#nc-track');
    const dotsBox = $('#nc-dots');
    const countEl = $('#nc-count');
    const card = $('#name-card');
    const tilt = $('#nc-tilt');
    const barEl = $('#nc-bar');
    const playBtn = $('#nc-play');
    const burst = $('#nc-burst');
    const slides = track ? Array.from(track.children) : [];
    const total = slides.length;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (viewport && track && total) {
        let index = 0, width = viewport.clientWidth;
        let dragging = false, startX = 0, dx = 0;
        let playing = !reduce, hover = false, elapsed = 0, last = performance.now();
        const DUR = 4500; // lama tiap anggota tampil (ms)

        // tombol inisial: klik untuk lompat ke anggota
        const dots = slides.map((s, i) => {
            const d = document.createElement('button');
            d.className = 'nc-chip';
            d.textContent = $('.nc-avatar span', s).textContent;
            d.setAttribute('aria-label', $('h3', s).textContent);
            d.addEventListener('click', () => goTo(i));
            dotsBox.appendChild(d);
            return d;
        });

        function render(animate) {
            track.style.transition = animate ? 'transform .55s cubic-bezier(.22,1,.36,1)' : 'none';
            track.style.transform = 'translateX(' + (-index * width + dx) + 'px)';
            dots.forEach((d, i) => d.classList.toggle('active', i === index));
            slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
            if (countEl) countEl.textContent = (index + 1) + ' / ' + total;
        }

        function sparkle() {
            if (!burst || reduce) return;
            const r = viewport.getBoundingClientRect(), c = card.getBoundingClientRect();
            burst.style.left = (r.left - c.left + r.height * 0.5) + 'px';
            burst.style.top = (r.top - c.top + r.height * 0.5) + 'px';
            for (let k = 0; k < 10; k++) {
                const s = document.createElement('span');
                s.textContent = '✦';
                burst.appendChild(s);
                const a = Math.random() * 6.28, d = 30 + Math.random() * 40;
                s.animate([
                    { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
                    { transform: 'translate(calc(-50% + ' + Math.cos(a) * d + 'px), calc(-50% + ' + Math.sin(a) * d + 'px)) scale(1.1)', opacity: 0 }
                ], { duration: 700 + Math.random() * 300, easing: 'ease-out' }).onfinish = () => s.remove();
            }
        }

        function goTo(i) {
            const prev = index;
            index = (i + total) % total;   // setelah anggota terakhir kembali ke anggota pertama
            dx = 0; elapsed = 0;
            render(true);
            if (index !== prev) sparkle();
        }

        $('#nc-next').addEventListener('click', () => goTo(index + 1));
        $('#nc-prev').addEventListener('click', () => goTo(index - 1));

        // jeda / putar geser otomatis
        playBtn.addEventListener('click', () => {
            playing = !playing;
            playBtn.innerHTML = '<i class="fa-solid ' + (playing ? 'fa-pause' : 'fa-play') + '"></i>';
            playBtn.setAttribute('aria-label', playing ? 'Jeda geser otomatis' : 'Putar geser otomatis');
        });
        if (!playing) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';

        // geser otomatis + bar progres (berhenti saat kursor di kartu / sedang drag)
        (function tick(now) {
            const dt = now - last; last = now;
            if (playing && !hover && !dragging && !document.hidden) {
                elapsed += dt;
                if (elapsed >= DUR) goTo(index + 1);
            }
            if (barEl) barEl.style.transform = 'scaleX(' + Math.min(elapsed / DUR, 1) + ')';
            requestAnimationFrame(tick);
        })(performance.now());

        // kartu miring 3D mengikuti mouse + kilau emas
        card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hover = true; });
        card.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse' || reduce) return;
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            tilt.style.setProperty('--ry', ((x - 0.5) * 14) + 'deg');
            tilt.style.setProperty('--rx', ((0.5 - y) * 10) + 'deg');
            card.style.setProperty('--mx', (x * 100) + '%');
            card.style.setProperty('--my', (y * 100) + '%');
        });
        card.addEventListener('pointerleave', () => {
            hover = false;
            tilt.style.setProperty('--rx', '0deg');
            tilt.style.setProperty('--ry', '0deg');
        });

        // --- drag dengan mouse / sentuh ---
        viewport.addEventListener('pointerdown', (e) => {
            dragging = true;
            startX = e.clientX;
            dx = 0;
            width = viewport.clientWidth;
            viewport.classList.add('grabbing');
            viewport.setPointerCapture(e.pointerId);
            track.style.transition = 'none';
        });

        viewport.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            dx = e.clientX - startX;
            if ((index === 0 && dx > 0) || (index === total - 1 && dx < 0)) dx *= 0.35;
            render(false);
        });

        function endDrag() {
            if (!dragging) return;
            dragging = false;
            viewport.classList.remove('grabbing');
            const moved = dx;
            dx = 0;
            if (Math.abs(moved) > width * 0.18) {
                const next = moved < 0 ? index + 1 : index - 1;
                goTo(Math.max(0, Math.min(total - 1, next)));
            } else {
                render(true);
            }
        }
        viewport.addEventListener('pointerup', endDrag);
        viewport.addEventListener('pointercancel', endDrag);
        viewport.addEventListener('lostpointercapture', endDrag);

        // --- keyboard (kiri / kanan) ---
        viewport.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') goTo(index + 1);
            if (e.key === 'ArrowLeft') goTo(index - 1);
        });

        window.addEventListener('resize', () => { width = viewport.clientWidth; render(false); });

        render(false);
    }

    /* ---------- 4b. GALERI FOTO (slider) ---------- */
    const galSlide = $('#gal-slide');
    if (galSlide) {
        // Next: foto paling depan dipindah ke belakang. Prev: foto paling belakang dipindah ke depan.
        $('#gal-next').addEventListener('click', () => galSlide.appendChild(galSlide.firstElementChild));
        $('#gal-prev').addEventListener('click', () => galSlide.prepend(galSlide.lastElementChild));
    }

    /* ---------- 4b-2. LIGHTBOX GALERI (foto penuh + keterangan) ---------- */
    const lb = $('#lb');
    if (galSlide && lb) {
        const galItems = Array.from(galSlide.children);
        const lbMedia = $('.lb-media', lb), lbImg = $('#lb-img'), lbSide = $('.lb-side', lb);
        const lbCount = $('#lb-count'), lbTitle = $('#lb-title'), lbDes = $('#lb-des'), lbNotes = $('#lb-notes');
        let cur = 0, isOpen = false, lastFocus = null, closeTimer = null;

        const data = (item) => ({
            img: item.dataset.img || '',
            title: ($('.gal-name', item) || {}).textContent || '',
            des: ($('.gal-des', item) || {}).textContent || '',
            notes: Array.from(item.querySelectorAll('.gal-notes li')).map((li) => li.textContent)
        });

        function fill(i, animate) {
            cur = (i + galItems.length) % galItems.length;
            const d = data(galItems[cur]);
            lbMedia.classList.remove('is-empty');
            lbImg.onerror = () => lbMedia.classList.add('is-empty');
            lbImg.alt = d.title;
            lbImg.src = d.img;
            lbCount.textContent = 'Foto ' + (cur + 1) + ' dari ' + galItems.length;
            lbTitle.textContent = d.title;
            lbDes.textContent = d.des;
            lbNotes.innerHTML = '';
            d.notes.forEach((n) => { const li = document.createElement('li'); li.textContent = n; lbNotes.appendChild(li); });
            lbSide.scrollTop = 0;
            if (animate && !reduce && lbImg.animate) {
                lbImg.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'ease-out' });
                Array.from(lbSide.children).forEach((el, k) => {
                    if (el.tagName === 'DIV') return;
                    el.animate([{ opacity: 0, transform: 'translateX(18px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: 60 + k * 50, easing: 'ease-out', fill: 'backwards' });
                });
            }
        }

        function openLb(i) {
            clearTimeout(closeTimer);
            lastFocus = document.activeElement;
            fill(i, true);
            lb.hidden = false;
            void lb.offsetWidth;
            lb.classList.add('open');
            isOpen = true;
            if (lenis) lenis.stop(); else document.documentElement.style.overflow = 'hidden';
            $('#lb-close').focus({ preventScroll: true });
        }

        function closeLb() {
            if (!isOpen) return;
            isOpen = false;
            lb.classList.remove('open');
            if (lenis) lenis.start(); else document.documentElement.style.overflow = '';
            // slider ikut menampilkan foto yang terakhir dilihat di depan
            let guard = galItems.length;
            while (galSlide.children[1] !== galItems[cur] && guard-- > 0) galSlide.appendChild(galSlide.firstElementChild);
            closeTimer = setTimeout(() => { lb.hidden = true; }, reduce ? 0 : 350);
            if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
        }

        galSlide.addEventListener('click', (e) => {
            const item = e.target.closest('.gal-item');
            if (!item || getComputedStyle(item).opacity === '0') return;
            openLb(galItems.indexOf(item));
        });
        $('#lb-close').addEventListener('click', closeLb);
        $('#lb-backdrop').addEventListener('click', closeLb);
        $('#lb-prev').addEventListener('click', () => fill(cur - 1, true));
        $('#lb-next').addEventListener('click', () => fill(cur + 1, true));
        // klik "Lihat Tutorial" di lightbox: tutup dulu supaya scroll halus
        document.addEventListener('click', (e) => { if (isOpen && e.target.closest('#lb-link')) closeLb(); }, true);

        document.addEventListener('keydown', (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') closeLb();
            else if (e.key === 'ArrowRight') fill(cur + 1, true);
            else if (e.key === 'ArrowLeft') fill(cur - 1, true);
            else if (e.key === 'Tab') {
                const f = Array.from(lb.querySelectorAll('button, a[href]')).filter((el) => el.offsetParent !== null);
                if (!f.length) return;
                const first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });
    }

    /* ---------- 4c. BG MODEL 3D (Three.js + JSON) ---------- */
    const cv = $('#bg3d'), modelEl = $('#bg-model-json');
    if (cv && modelEl && window.THREE) {
        try {
            const renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
            camera.position.z = 9;

            // muat model dari JSON
            const model = new THREE.ObjectLoader().parse(JSON.parse(modelEl.textContent));
            scene.add(model);

            scene.add(new THREE.AmbientLight(0xffffff, 0.45));
            const l1 = new THREE.PointLight(0xE8D090, 1.5); l1.position.set(4, 4, 5); scene.add(l1);
            const l2 = new THREE.PointLight(0x8C6239, 1.2); l2.position.set(-4, -2, 3); scene.add(l2);

            // debu emas di belakang model
            const pts = [];
            for (let i = 0; i < 160; i++) pts.push((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10 - 3);
            const pg = new THREE.BufferGeometry();
            pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xB8901F, size: 0.04, transparent: true, opacity: 0.55 })));

            let mx = 0, my = 0, sp = 0;
            window.addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
            const size = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
            size();
            window.addEventListener('resize', size);

            const clock = new THREE.Clock();
            (function loop() {
                const t = reduce ? 0 : clock.getElapsedTime();
                const max = document.documentElement.scrollHeight - innerHeight;
                sp += ((max > 0 ? scrollY / max : 0) - sp) * 0.06;
                const mobile = innerWidth < 820;
                const tx = mobile ? 0 : 3.2 * Math.sin(sp * Math.PI * 3);
                model.position.x += (tx - model.position.x) * 0.05;
                model.position.y += ((-my * 0.8 + Math.sin(t * 0.6) * 0.15) - model.position.y) * 0.05;
                model.rotation.y = t * 0.25 + sp * Math.PI * 2 + mx * 0.8;
                model.rotation.x = 0.35 + my * 0.4;
                model.scale.setScalar(mobile ? 0.8 : 1.1);
                renderer.render(scene, camera);
                requestAnimationFrame(loop);
            })();
        } catch (err) { cv.remove(); }
    }

    /* ---------- 4d. BUKU BERJILID (Pengertian VirtualBox) ---------- */
    const bk = $('#bk');
    if (bk) {
        const leaves = [].slice.call(bk.querySelectorAll('.bk-leaf')).reverse(); // urutan: sampul, hal 1, hal 2
        const dots = bk.querySelectorAll('.bk-dot');
        const prev = $('#bk-prev'), next = $('#bk-next');
        const N = leaves.length;
        let step = 0, touched = false;

        function go(s, byUser) {
            if (byUser) touched = true;
            step = Math.max(0, Math.min(N, s));
            leaves.forEach((l, i) => l.classList.toggle('flipped', i < step));
            dots.forEach((d, i) => d.classList.toggle('active', i === step));
            prev.disabled = step === 0;
            next.disabled = step === N;
            bk.dataset.step = step;
        }
        go(0);

        prev.addEventListener('click', () => go(step - 1, true));
        next.addEventListener('click', () => go(step + 1, true));
        $('#bk-again').addEventListener('click', () => go(0, true));
        $('.bk-book', bk).addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            if (step < N) go(step + 1, true);
        });
        document.addEventListener('keydown', (e) => {
            const r = bk.getBoundingClientRect();
            if (r.bottom < 0 || r.top > innerHeight || e.target.closest('input, textarea, .lb')) return;
            if (e.key === 'ArrowRight' && step > 0) go(step + 1, true);
            if (e.key === 'ArrowLeft' && step > 0) go(step - 1, true);
        });

        // sampul tampil dulu, lalu terbuka sendiri sekali saat section muncul
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((es) => {
                if (!es[0].isIntersecting) return;
                io.disconnect();
                setTimeout(() => { if (!touched && step === 0) go(1); }, 1800);
            }, { threshold: 0.6 });
            io.observe(bk);
        }
    }

    /* ---------- SAYAP BERJATUHAN (dekorasi tema putih-emas) ---------- */
    const wingsBox = $('#wings-fx');
    if (wingsBox && !reduce) {
        const small = window.innerWidth < 820;
        const COUNT = small ? 7 : 14;          // ubah angka ini untuk menambah / mengurangi sayap
        const rnd = (a, b) => a + Math.random() * (b - a);
        for (let i = 0; i < COUNT; i++) {
            const dur = rnd(16, 30);
            const w = document.createElement('span');
            w.className = 'wing';
            w.style.cssText =
                '--l:' + rnd(0, 96).toFixed(1) + '%;' +
                '--s:' + rnd(small ? 26 : 34, small ? 50 : 82).toFixed(0) + 'px;' +
                '--d:' + dur.toFixed(1) + 's;' +
                '--dl:' + (-rnd(0, dur)).toFixed(1) + 's;' +      // delay negatif: sayap sudah tersebar saat halaman dibuka
                '--dx:' + rnd(-140, 140).toFixed(0) + 'px;' +
                '--r0:' + rnd(-35, -5).toFixed(0) + 'deg;' +
                '--r1:' + rnd(5, 35).toFixed(0) + 'deg;' +
                '--o:' + rnd(0.38, 0.8).toFixed(2) + ';' +
                '--f:' + (Math.random() < 0.5 ? -1 : 1) + ';';
            w.innerHTML = '<svg class="wing-svg" viewBox="0 0 140 90" aria-hidden="true"><use href="#wing"/></svg>';
            wingsBox.appendChild(w);
        }
    }

    /* ---------- VIDEO BACKGROUND HERO ---------- */
    const heroVideo = $('#hero-video');
    const heroSec = $('#kelompok');
    if (heroVideo && heroSec) {
        const conn = navigator.connection || {};
        const lite = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
        if (reduce || lite) {
            heroVideo.pause();
            heroVideo.querySelectorAll('source').forEach((src) => src.remove());
            heroVideo.removeAttribute('src');
            heroVideo.load();
            heroVideo.remove();                 // poster tetap tampil lewat background .hero-bg
        } else {
            heroVideo.muted = true;             // wajib muted supaya autoplay diizinkan browser
            let heroVisible = true;
            const play = () => { const pr = heroVideo.play(); if (pr && pr.catch) pr.catch(() => { }); };
            if ('IntersectionObserver' in window) {
                new IntersectionObserver((entries) => {
                    heroVisible = entries[0].isIntersecting;
                    if (heroVisible && !document.hidden) play(); else heroVideo.pause();
                }, { threshold: 0.05 }).observe(heroSec);
            }
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) heroVideo.pause(); else if (heroVisible) play();
            });
        }
    }

    /* ---------- 5. ANIMASI MUNCUL SAAT SCROLL ---------- */
    if (hasScrollTrigger) {
        gsap.utils.toArray('.reveal').forEach((el) => {
            gsap.from(el, {
                y: 50, autoAlpha: 0, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
            });
        });
    }
})();


/* =========================================================
   BUKU BERSAYAP + INTERAKTIVITAS
   ========================================================= */
(function () {
    const $ = (s, e = document) => e.querySelector(s), $$ = (s, e = document) => Array.from(e.querySelectorAll(s));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(pointer: fine)').matches;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const inView = (el, cb, th) => {
        if (!('IntersectionObserver' in window)) return cb();
        const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) { io.disconnect(); cb(); } }, { threshold: th || 0.3 });
        io.observe(el);
    };

    /* toast kecil */
    const toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast);
    let tt; const say = (m) => { toast.textContent = m; toast.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 1700); };

    /* A. BUKU BERSAYAP: sayap dipasang lewat JS */
    const bk = $('#bk'), wrap = $('#vb-book');
    if (bk && wrap) {
        const mk = (side, src) => { const i = new Image(); i.src = src; i.alt = ''; i.draggable = false; i.className = 'bk-wing bk-wing-' + side; i.setAttribute('aria-hidden', 'true'); return i; };
        const wl = mk('l', 'sayap-kiri-1.png'), wr = mk('r', 'sayap-kanan-1.png');
        bk.prepend(wl, wr);
        inView(bk, () => bk.classList.add('wings-on'), 0.35);   // sayap mengembang saat buku terlihat

        const feathers = (n) => {
            if (reduce) return;
            for (let k = 0; k < n; k++) {
                const f = document.createElement('i'); f.className = 'fth';
                f.style.left = rnd(-20, 120) + '%'; f.style.top = rnd(15, 65) + '%';
                bk.appendChild(f);
                f.animate([
                    { transform: 'translate(0,0) rotate(0)', opacity: 0 },
                    { opacity: 1, offset: .15 },
                    { transform: 'translate(' + rnd(-90, 90) + 'px,' + rnd(160, 300) + 'px) rotate(' + rnd(-200, 200) + 'deg)', opacity: 0 }
                ], { duration: rnd(2200, 3600), easing: 'ease-out' }).onfinish = () => f.remove();
            }
        };
        const beat = () => {          // kepakan kuat + bulu berjatuhan setiap halaman dibalik
            if (reduce) return;
            [wl, wr].forEach((w, k) => w.animate([{ rotate: '0deg', scale: 1 }, { rotate: (k ? '-' : '') + '24deg', scale: 1.08 }, { rotate: '0deg', scale: 1 }], { duration: 800, easing: 'ease-in-out' }));
            feathers(9);
        };
        new MutationObserver(beat).observe(bk, { attributes: true, attributeFilter: ['data-step'] });
        wrap.addEventListener('dblclick', beat);   // klik 2x = kepak manual

        if (fine && !reduce) {        // buku & sayap mengikuti arah kursor
            wrap.addEventListener('pointermove', (e) => {
                const r = bk.getBoundingClientRect();
                bk.style.setProperty('--px', ((e.clientX - r.left) / r.width - .5).toFixed(3));
                bk.style.setProperty('--py', ((e.clientY - r.top) / r.height - .5).toFixed(3));
            });
            wrap.addEventListener('pointerleave', () => { bk.style.setProperty('--px', 0); bk.style.setProperty('--py', 0); });
        }
    }

    /* B. kartu langkah & perintah: kilau emas + miring 3D */
    if (fine && !reduce) $$('.step, .cmd').forEach((el) => {
        el.addEventListener('pointermove', (e) => {
            const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
            el.style.transform = 'perspective(800px) rotateX(' + (.5 - y) * 7 + 'deg) rotateY(' + (x - .5) * 9 + 'deg) translateY(-5px)';
        });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    /* C. klik perintah = salin */
    $$('.cmd-code').forEach((c) => {
        c.title = 'Klik untuk menyalin';
        c.addEventListener('click', (e) => {
            e.stopPropagation();
            const t = c.textContent.trim();
            (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => say('Disalin: ' + t)).catch(() => say('Gagal menyalin'));
        });
    });

    /* D. langkah install dicentang + bar progres */
    const box = $('.steps'), steps = $$('.step');
    if (box) {
        const p = document.createElement('div'); p.className = 'steps-prog'; p.innerHTML = '<span></span><div><i></i></div>'; box.before(p);
        const upd = () => {
            const n = steps.filter((s) => s.classList.contains('done')).length;
            p.firstChild.textContent = n + ' / ' + steps.length + ' langkah selesai (klik kartu untuk menandai)';
            p.querySelector('i').style.width = (n / steps.length * 100) + '%';
            if (n === steps.length) say('Semua langkah selesai ✦');
        };
        steps.forEach((s) => s.addEventListener('click', () => { s.classList.toggle('done'); upd(); }));
        upd();
    }

    /* E. contoh terminal: baris muncul bertahap */
    const code = $('.terminal code');
    if (code && !reduce) {
        code.innerHTML = code.innerHTML.split('\n').map((l) => '<span class="tl">' + l + '</span>').join('') + '<span class="caret"></span>';
        inView($('.terminal'), () => $$('.tl', code).forEach((l, i) =>
            l.animate([{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: i * 320, fill: 'forwards', easing: 'ease-out' })), 0.4);
    }

    /* F. menu header menandai bagian yang sedang dibaca */
    const links = $$('.nav a');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((es) => es.forEach((e) => {
            if (e.isIntersecting) links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
        }), { rootMargin: '-45% 0px -50% 0px' });
        links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
    }

    /* G. jejak kilau emas mengikuti kursor (hanya mouse) */
    if (fine && !reduce) {
        let last = 0;
        addEventListener('pointermove', (e) => {
            const n = performance.now();
            if (e.pointerType !== 'mouse' || n - last < 70) return;
            last = n;
            const s = document.createElement('i'); s.className = 'trail'; s.textContent = '✦';
            s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
            document.body.appendChild(s);
            s.animate([{ opacity: .9, transform: 'scale(.6)' }, { opacity: 0, transform: 'translate(' + rnd(-14, 14) + 'px,' + rnd(14, 34) + 'px) scale(1.2) rotate(90deg)' }], { duration: 900, easing: 'ease-out' }).onfinish = () => s.remove();
        }, { passive: true });
    }

    /* H. karakter hero bergeser tipis mengikuti kursor */
    const hero = $('#kelompok'), img = $('.char-img');
    if (hero && img && fine && !reduce) hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        img.style.translate = ((e.clientX - r.left) / r.width - .5) * -22 + 'px ' + ((e.clientY - r.top) / r.height - .5) * -12 + 'px';
    });
})();


/* -> sembunyikan supaya teks alt-nya tidak muncul di hero */
(function () {
    const img = document.querySelector('.char-img');
    if (!img) return;
    const bad = () => img.remove();
    if (img.complete && img.naturalWidth === 0) bad(); else img.addEventListener('error', bad);
})();


/* Materi baru: kalkulator chmod (section #hak-akses) */
(function () {
    const c = document.getElementById('pm-calc');
    if (!c) return;
    const cks = Array.from(c.querySelectorAll('input[type=checkbox]')), num = c.querySelector('#pm-num'), sym = c.querySelector('#pm-sym'), cmd = c.querySelector('#pm-cmd');
    const upd = () => {
        let n = '', s = '';
        for (let r = 0; r < 3; r++) { let v = 0;[4, 2, 1].forEach((b, i) => { const on = cks[r * 3 + i].checked; if (on) v += b; s += on ? 'rwx'[i] : '-'; }); n += v; }
        num.textContent = n; sym.textContent = s; cmd.textContent = 'chmod ' + n + ' nama_file';
    };
    const set = (p) => { Array.from(p).forEach((d, r) => [4, 2, 1].forEach((b, i) => { cks[r * 3 + i].checked = (+d & b) > 0; })); upd(); };
    cks.forEach((k) => k.addEventListener('change', upd));
    c.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => set(b.dataset.p)));
    cmd.addEventListener('click', () => {
        const t = cmd.textContent;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { cmd.textContent = 'Disalin \u2713'; setTimeout(upd, 1000); }).catch(() => { });
    });
    set('755');
})();