(function(){
  "use strict";

  var reduce  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine    = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined';

  document.getElementById('yr').textContent = new Date().getFullYear();

  /* ---------- asset fallbacks: no screenshot / no clip is a designed state ---------- */
  document.querySelectorAll('[data-cover]').forEach(function(img){
    img.addEventListener('error', function(){ img.remove(); });          /* generated art shows through */
    if (img.complete && img.naturalWidth === 0) img.remove();
  });
  document.querySelectorAll('[data-clip]').forEach(function(v){
    v.addEventListener('error', function(){ v.style.display = 'none'; }, true);
    v.addEventListener('loadeddata', function(){ v.dataset.ok = '1'; });
  });

  /* ---------- reveals ---------- */
  var revealables = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)){
    revealables.forEach(function(el){ el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin:'0px 0px -12% 0px', threshold:.12 });
    revealables.forEach(function(el){ io.observe(el); });
  }

  /* ---------- nav ---------- */
  var nav = document.getElementById('nav'), navTick = false;
  function navState(){ nav.classList.toggle('is-stuck', window.scrollY > 40); navTick = false; }
  window.addEventListener('scroll', function(){ if (!navTick){ navTick = true; requestAnimationFrame(navState); } }, { passive:true });
  navState();

  /* ============================================================
     Flip cards
     ============================================================ */
  var openCard = null;

  /* Full digits with separators. A counter that changes unit mid-flight
     (0 → 1.2K → 12.4K) reads as glitching rather than counting, so every
     number climbs through its real value. Tabular figures keep the width
     stable, so nothing reflows while it ticks. */
  function fmtNum(n, el){
    return (el.getAttribute('data-prefix') || '')
         + Math.round(n).toLocaleString('en-US')
         + (el.getAttribute('data-suffix') || '');
  }

  function countUp(card){
    var stats = card.querySelectorAll('.stat');
    var nums  = card.querySelectorAll('[data-count]');

    if (reduce || !hasGSAP){
      nums.forEach(function(el){
        el.textContent = fmtNum(parseFloat(el.getAttribute('data-count')) || 0, el);
      });
      return;
    }

    /* the row settles in first, one stat after another */
    gsap.fromTo(stats,
      { y:14, opacity:0 },
      { y:0, opacity:1, duration:.5, stagger:.11, ease:'expo.out', overwrite:'auto' });

    nums.forEach(function(el, i){
      var target = parseFloat(el.getAttribute('data-count')) || 0;

      if (el._count) el._count.kill();     /* re-flipping restarts cleanly */
      el.textContent = fmtNum(0, el);

      var o = { v:0 };
      el._count = gsap.to(o, {
        v: target,
        /* bigger numbers get a little longer to climb, so a 2.1M and a 12K
           feel like they're moving at the same rate rather than the same clock */
        duration: 1.15 + Math.min(Math.log10(Math.max(target,10)) * .1, .55),
        delay: .12 + i * .11,
        ease: 'power3.out',
        onUpdate: function(){ el.textContent = fmtNum(o.v, el); }
      });
    });
  }

  /* hide a face from both the tab order and the a11y tree */
  function hideFace(face, hidden){
    if ('inert' in HTMLElement.prototype) face.inert = hidden;
    else face.querySelectorAll('a,button').forEach(function(f){
      if (hidden) f.setAttribute('tabindex','-1'); else f.removeAttribute('tabindex');
    });
    face.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }

  function flip(card, on, viaKeyboard){
    if (on && openCard && openCard !== card) flip(openCard, false);

    card.classList.toggle('is-flipped', on);
    var btn   = card.querySelector('.face--front .flipbtn');
    var back  = card.querySelector('.face--back');
    var front = card.querySelector('.face--front');
    var vid   = card.querySelector('[data-clip]');

    if (btn) btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    hideFace(back,  !on);
    hideFace(front,  on);

    if (on){
      openCard = card;
      countUp(card);
      if (vid){ var p = vid.play(); if (p && p.catch) p.catch(function(){}); }
      if (viaKeyboard){
        var first = back.querySelector('a,button');
        if (first) setTimeout(function(){ first.focus({ preventScroll:true }); }, reduce ? 0 : 380);
      }
    } else {
      if (openCard === card) openCard = null;
      if (vid){ vid.pause(); vid.currentTime = 0; }
      if (viaKeyboard && btn) btn.focus({ preventScroll:true });
    }
  }

  document.querySelectorAll('.card[data-slug]').forEach(function(card){
    var front = card.querySelector('.face--front');

    /* back face starts closed — out of the tab order and the a11y tree */
    hideFace(card.querySelector('.face--back'), true);

    /* whole front face is tappable */
    front.addEventListener('click', function(){ flip(card, true, false); });
    /* the button is the accessible control — don't double-fire. detail===0 means keyboard */
    front.querySelector('.flipbtn').addEventListener('click', function(e){
      e.stopPropagation(); flip(card, true, e.detail === 0);
    });

    card.querySelector('[data-close]').addEventListener('click', function(e){
      e.stopPropagation(); flip(card, false, e.detail === 0);
    });

    /* pointer spotlight position, used by the tint gradients */
    card.addEventListener('pointermove', function(e){
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top)  + 'px');
    }, { passive:true });

    /* subtle lift + press feedback */
    if (!reduce && hasGSAP){
      card.addEventListener('pointerenter', function(){
        if (!card.classList.contains('is-flipped')) gsap.to(card, { y:-6, duration:.45, ease:'power3.out', overwrite:'auto' });
      });
      card.addEventListener('pointerleave', function(){
        gsap.to(card, { y:0, scale:1, duration:.6, ease:'power3.out', overwrite:'auto' });
      });
      card.addEventListener('pointerdown', function(){
        gsap.to(card, { scale:.985, duration:.12, ease:'power2.out', overwrite:'auto' });
      });
      ['pointerup','pointercancel'].forEach(function(ev){
        card.addEventListener(ev, function(){ gsap.to(card, { scale:1, duration:.35, ease:'power3.out' }); });
      });
    }
  });

  /* Escape closes whatever is open */
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && openCard) flip(openCard, false, true);
  });

  /* ============================================================
     Loader + hero entrance
     ============================================================ */
  var loader     = document.getElementById('loader');
  var markLetters= document.querySelectorAll('.mark__l > span');
  var markSuffix = document.querySelector('.mark__suffix > span');
  var sweep      = document.querySelector('.mark__sweep');

  function unlock(){ document.body.classList.remove('is-locked'); }

  if (reduce || !hasGSAP){
    if (loader) loader.style.display = 'none';
    unlock();
  } else {
    document.body.classList.add('is-locked');
    gsap.set(markLetters, { yPercent:118 });
    gsap.set(markSuffix,  { yPercent:120, opacity:0 });
    setTimeout(unlock, 3200); /* never leave the page locked */

    gsap.timeline({ defaults:{ ease:'power3.out' }, onComplete:unlock })
      .to('#loaderbar', { scaleX:1, duration:.85, ease:'power2.inOut' }, 0)
      .to('.loader__mark span', { opacity:1, y:0, duration:.6, stagger:.07 }, .1)
      .to('.loader__mark span', { y:'-110%', opacity:0, duration:.42, stagger:.04, ease:'power3.in' }, .95)
      .to(loader, { yPercent:-100, duration:.75, ease:'expo.inOut', onComplete:function(){ loader.style.display='none'; } }, 1.15)
      .to(markLetters, { yPercent:0, duration:1.05, stagger:.075, ease:'expo.out' }, 1.35)
      .to(markSuffix,  { yPercent:0, opacity:1, duration:.9, ease:'expo.out' }, 1.62)
      .fromTo(sweep, { xPercent:-115, opacity:0 }, { xPercent:115, opacity:1, duration:1.5, ease:'power2.inOut' }, 1.8)
      .to(sweep, { opacity:0, duration:.4 }, 2.9)
      .from('.eyebrow', { opacity:0, y:14, duration:.7 }, 1.5);

    gsap.to('.markwrap', { y:-6, duration:3.6, ease:'sine.inOut', yoyo:true, repeat:-1, delay:3 });

    gsap.to('.bleed--a', { xPercent:12,  yPercent:16,  scale:1.12, duration:17, ease:'sine.inOut', yoyo:true, repeat:-1 });
    gsap.to('.bleed--b', { xPercent:-14, yPercent:10,  scale:1.08, duration:21, ease:'sine.inOut', yoyo:true, repeat:-1, delay:1.5 });
    gsap.to('.bleed--c', { xPercent:10,  yPercent:-14, scale:1.15, duration:24, ease:'sine.inOut', yoyo:true, repeat:-1, delay:3 });
  }

  /* ---------- hero pointer parallax ---------- */
  if (fine && !reduce && hasGSAP){
    var lettersAll = Array.prototype.slice.call(document.querySelectorAll('.mark__l > span'));
    lettersAll.push(markSuffix);
    document.querySelector('.hero').addEventListener('pointermove', function(e){
      var nx = (e.clientX / window.innerWidth  - .5);
      var ny = (e.clientY / window.innerHeight - .5);
      lettersAll.forEach(function(el, i){
        gsap.to(el, { x:nx*(10+i*5), y:ny*(6+i*3), duration:.9, ease:'power3.out', overwrite:'auto' });
      });
      gsap.to('.bleed--a', { x:nx*-40, y:ny*-30, duration:1.4, ease:'power3.out', overwrite:'auto' });
      gsap.to('.bleed--b', { x:nx* 50, y:ny* 35, duration:1.6, ease:'power3.out', overwrite:'auto' });
    }, { passive:true });
  }

  /* ---------- scroll-linked ---------- */
  if (!reduce && hasGSAP && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);

    gsap.to('.hero .wrap', {
      yPercent:-14, opacity:.15, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:.6 }
    });

    var creed = document.querySelector('[data-creed]');
    if (creed){
      (function splitWords(node){
        var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null), texts = [], n;
        while ((n = walker.nextNode())) texts.push(n);
        texts.forEach(function(t){
          var frag = document.createDocumentFragment();
          t.nodeValue.split(/(\s+)/).forEach(function(part){
            if (!part.trim()){ frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part;
            frag.appendChild(s);
          });
          t.parentNode.replaceChild(frag, t);
        });
      })(creed);

      gsap.to(creed.querySelectorAll('.w'), {
        opacity:1, ease:'none', stagger:.4,
        scrollTrigger:{ trigger:creed, start:'top 78%', end:'bottom 58%', scrub:.4 }
      });
    }

    gsap.from('#footmark span', {
      yPercent:105, opacity:0, duration:.9, stagger:.05, ease:'expo.out',
      scrollTrigger:{ trigger:'#footmark', start:'top 92%' }
    });

    gsap.utils.toArray('.sec__title').forEach(function(t){
      gsap.from(t, { yPercent:12, opacity:0, duration:.9, ease:'expo.out',
        scrollTrigger:{ trigger:t, start:'top 88%' } });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce && hasGSAP){
    document.querySelectorAll('[data-magnetic]').forEach(function(el){
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        gsap.to(el, { x:(e.clientX-r.left-r.width/2)*.28, y:(e.clientY-r.top-r.height/2)*.34,
          duration:.5, ease:'power3.out', overwrite:'auto' });
      }, { passive:true });
      el.addEventListener('pointerleave', function(){
        gsap.to(el, { x:0, y:0, duration:.8, ease:'elastic.out(1,.45)' });
      });
    });
  }

  /* ---------- cursor ---------- */
  if (fine && !reduce && hasGSAP){
    var ring = document.querySelector('.cursor'), dot = document.querySelector('.cursor-dot');
    var xTo = gsap.quickTo(ring,'x',{duration:.45,ease:'power3'}),
        yTo = gsap.quickTo(ring,'y',{duration:.45,ease:'power3'}),
        xTd = gsap.quickTo(dot,'x',{duration:.08,ease:'power2'}),
        yTd = gsap.quickTo(dot,'y',{duration:.08,ease:'power2'});
    var shown = false;
    window.addEventListener('pointermove', function(e){
      if (!shown){ shown = true; gsap.to([ring,dot],{opacity:1,duration:.3}); }
      xTo(e.clientX); yTo(e.clientY); xTd(e.clientX); yTd(e.clientY);
    }, { passive:true });
    window.addEventListener('pointerleave', function(){ gsap.to([ring,dot],{opacity:0,duration:.25}); shown = false; });

    document.querySelectorAll('a,button,.card').forEach(function(el){
      el.addEventListener('pointerenter', function(){ gsap.to(ring,{scale:1.7,borderColor:'rgba(79,216,255,.7)',duration:.32,ease:'power3.out'}); });
      el.addEventListener('pointerleave', function(){ gsap.to(ring,{scale:1,borderColor:'rgba(255,255,255,.16)',duration:.32,ease:'power3.out'}); });
    });
  }

})();
