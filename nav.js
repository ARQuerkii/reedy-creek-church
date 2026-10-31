document.addEventListener('DOMContentLoaded', function () {
  var dropdowns = document.querySelectorAll('.nav-dropdown');

  dropdowns.forEach(function (dropdown) {
    var trigger = dropdown.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('open');
      trigger.setAttribute('aria-expanded', isOpen);
      dropdowns.forEach(function (other) {
        if (other !== dropdown) {
          other.classList.remove('open');
          var otherTrigger = other.querySelector('.nav-dropdown-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  document.addEventListener('click', function (e) {
    dropdowns.forEach(function (dropdown) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        var trigger = dropdown.querySelector('.nav-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      dropdowns.forEach(function (dropdown) {
        dropdown.classList.remove('open');
        var trigger = dropdown.querySelector('.nav-dropdown-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    }
  });

  var hamburger = document.getElementById('navHamburgerBtn');
  var mobilePanel = document.getElementById('navMobilePanel');
  if (hamburger && mobilePanel) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobilePanel.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });
  }

  // mobile.css balances wrapped text, but browsers only balance up to ~6 lines.
  // Longer paragraphs get 'pretty' wrapping instead, so they never end on a lone word.
  // Done in three passes - reset all, measure all, then apply - so the browser lays the page out
  // once. (Resetting and measuring each element in turn forced a full re-layout per element, which
  // froze scrolling and animations for a few seconds on a first visit, when the fonts arrive late.)
  function fitLongText() {
    var els = [].filter.call(document.querySelectorAll('p, li, figcaption, div'), function (el) {
      return [].some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
    });
    els.forEach(function (el) { el.style.textWrap = ''; });
    var range = document.createRange();
    var tooLong = els.map(function (el) {
      var lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
      // measure the text itself - some elements are stretched taller than their text
      range.selectNodeContents(el);
      return range.getBoundingClientRect().height / lineHeight > 6.5;
    });
    els.forEach(function (el, i) { if (tooLong[i]) el.style.textWrap = 'pretty'; });
  }
  // Weekly bulletin sign-up: send the email straight to the church's MailerLite list and
  // say thanks on the page - but only once MailerLite confirms it. If MailerLite can't be
  // reached, fall back to posting the form normally. Without scripts it posts directly too.
  var bulletin = document.querySelector('.bulletin-form');
  if (bulletin && window.fetch && window.FormData) {
    var button = bulletin.querySelector('button');
    var buttonText = button.textContent;
    var error = document.createElement('p');
    error.setAttribute('role', 'alert');
    error.style.cssText = 'font-size:0.82rem;color:#B3261E;margin:8px 0 0;display:none;';
    button.parentNode.insertAdjacentElement('afterend', error);
    bulletin.addEventListener('submit', function (e) {
      e.preventDefault();
      button.disabled = true;
      button.textContent = 'Signing up...';
      error.style.display = 'none';
      var data = new FormData(bulletin);
      data.append('ajax', '1');
      fetch(bulletin.action, { method: 'POST', body: data })
        .then(function (res) { return res.json(); })
        .then(function (res) {
          if (res && res.success) {
            bulletin.innerHTML = '<p style="font-size:1rem;font-weight:700;color:#3D3935;margin:0 0 6px;">Thanks for signing up!</p>' +
              '<p style="font-size:0.9rem;color:#666;line-height:1.7;margin:0;">Keep an eye on your inbox - the next bulletin is on its way.</p>';
            return;
          }
          var msg = res && res.errors && res.errors.fields && res.errors.fields.email;
          error.textContent = msg && /valid/i.test(msg[0]) ? 'That email doesn\'t look quite right - can you check it?' : 'Sorry, that didn\'t go through. Please try again.';
          error.style.display = 'block';
          button.disabled = false;
          button.textContent = buttonText;
        })
        .catch(function () { bulletin.submit(); });
    });
  }

  // Live stream of the Saturday service. A static site can't ask YouTube whether the channel is live,
  // so this goes by the service time: Saturdays 10:40am - 12:15pm Gold Coast time (UTC+10 all year).
  // Every page gets a "Live now" pop-up; the sermons page shows the player instead.
  // Add ?live=1 to any page address to preview it outside those times.
  var LIVE_CHANNEL = 'UCWf_sIje-5mC1kvIzzwkLqQ';
  var LIVE_ON_YOUTUBE = 'https://www.youtube.com/channel/' + LIVE_CHANNEL + '/live';
  var liveForced = /[?&]live=1\b/.test(location.search);
  function isLiveNow() {
    if (liveForced) return true;
    var gc = new Date(Date.now() + 10 * 3600e3);
    var mins = gc.getUTCHours() * 60 + gc.getUTCMinutes();
    return gc.getUTCDay() === 6 && mins >= 640 && mins < 735;
  }
  function storage(key, value) {
    try { if (value === undefined) return sessionStorage.getItem(key); sessionStorage.setItem(key, value); } catch (e) { return null; }
  }
  var liveSection = document.getElementById('live');
  var livePop = null;
  function checkLive() {
    var live = isLiveNow();
    if (liveSection) {
      // sermons page: show the player (only loaded while live, so it never shows YouTube's "offline" box)
      var player = document.getElementById('live-player');
      // the "Watch live" link at the top jumps down to the player while it's on, and to YouTube otherwise
      var link = document.getElementById('live-link');
      if (link) {
        var arrow = link.querySelector('.arw') ? '' : '→';   // keep the arrow, whether or not it's been wrapped yet
        if (live) { link.href = '#live'; link.removeAttribute('target'); link.firstChild.nodeValue = 'Watch the livestream now ' + arrow; }
        else { link.href = LIVE_ON_YOUTUBE; link.target = '_blank'; link.firstChild.nodeValue = 'Watch live on YouTube ' + arrow; }
      }
      if (live && liveSection.hidden) {
        liveSection.hidden = false;
        player.src = 'https://www.youtube.com/embed/live_stream?channel=' + LIVE_CHANNEL + '&rel=0';
        if (location.hash === '#live') {
          // the section was hidden when the browser tried to jump to it, so jump now - and again once
          // the sermon thumbnails above have loaded and pushed it further down the page
          var jump = function () { liveSection.scrollIntoView(); return scrollY; };
          var landed = jump();
          addEventListener('load', function () {
            landed = jump();
            // earlier-message thumbnails can arrive just after; re-jump unless the visitor has scrolled away
            setTimeout(function () { if (Math.abs(scrollY - landed) < 5) jump(); }, 1200);
          });
        }
      } else if (!live && !liveSection.hidden) {
        liveSection.hidden = true;
        player.removeAttribute('src');
      }
      return;
    }
    if (live && !livePop && storage('liveClosed') !== '1') {
      var navScript = document.querySelector('script[src*="nav.js"]');
      var base = navScript ? navScript.getAttribute('src').replace(/nav\.js.*$/, '') : '';
      livePop = document.createElement('div');
      livePop.className = 'live-pop';
      livePop.setAttribute('role', 'status');
      livePop.innerHTML =
        '<p class="live-badge"><span class="live-dot" aria-hidden="true"></span>Live now</p>' +
        '<p class="live-title">Our Sabbath service is streaming live right now.</p>' +
        '<div class="live-actions">' +
          '<a class="live-watch" href="' + base + 'sermons.html' + (liveForced ? '?live=1' : '') + '#live">Watch Live →</a>' +
          '<a class="live-yt" href="' + LIVE_ON_YOUTUBE + '" target="_blank" rel="noopener">Open on YouTube</a>' +
        '</div>' +
        '<button type="button" class="live-close" aria-label="Close">&times;</button>';
      document.body.appendChild(livePop);
      requestAnimationFrame(function () { requestAnimationFrame(function () { livePop.classList.add('in'); }); });
      livePop.querySelector('.live-close').addEventListener('click', function () {
        storage('liveClosed', '1');
        livePop.remove();
      });
    } else if (!live && livePop) {
      livePop.remove();
      livePop = null;
    }
  }
  checkLive();
  setInterval(checkLive, 60000);   // pops up on time even if the page was opened before 10:40

  // Arrows at the end of buttons and links get their own span so they can nudge on hover
  [].forEach.call(document.querySelectorAll('a, button'), function (el) {
    var last = el.lastChild;
    if (last && last.nodeType === 3 && /→\s*$/.test(last.nodeValue)) {
      last.nodeValue = last.nodeValue.replace(/→\s*$/, '');
      var arrow = document.createElement('span');
      arrow.className = 'arw';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      el.appendChild(arrow);
    }
  });

  // Headings and cards fade up as they scroll into view, a beat apart within a row.
  // Anything already on screen when the page loads is left alone, so nothing flickers.
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealSel = 'section h2, .ministry-card, .give-card, .hub-card, .earlier-card, .belief-card, .flow-step, .stat';
    var reveal = [].filter.call(document.querySelectorAll(revealSel), function (el) {
      return !el.closest('footer, nav, .photo-strip, .sched, body > section:first-of-type') &&
        el.getBoundingClientRect().top > window.innerHeight;
    });
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('rv-in');
        revealObs.unobserve(el);
        // once it's in, drop the stagger so hover effects respond straight away
        setTimeout(function () { el.style.transitionDelay = ''; el.classList.remove('rv', 'rv-in'); }, 1200);
      });
    }, { threshold: 0.15 });
    reveal.forEach(function (el) {
      var siblings = [].filter.call(el.parentNode.children, function (c) { return reveal.indexOf(c) > -1; });
      el.style.transitionDelay = Math.min(siblings.indexOf(el), 5) * 0.08 + 's';
      el.classList.add('rv');
      revealObs.observe(el);
    });
  }

  var fitTimer;
  window.addEventListener('resize', function () {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitLongText, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLongText);
  else fitLongText();
});
