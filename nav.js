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
  function fitLongText() {
    document.querySelectorAll('p, li, figcaption, div').forEach(function (el) {
      var ownText = Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (!ownText) return;
      el.style.textWrap = '';
      var lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
      // measure the text itself - some elements are stretched taller than their text
      var range = document.createRange();
      range.selectNodeContents(el);
      if (range.getBoundingClientRect().height / lineHeight > 6.5) el.style.textWrap = 'pretty';
    });
  }
  // Weekly bulletin sign-up: send the email straight to the church's MailerLite list and
  // say thanks on the page. Without scripts the form still posts to MailerLite directly.
  var bulletin = document.querySelector('.bulletin-form');
  if (bulletin && window.fetch && window.FormData) {
    bulletin.addEventListener('submit', function (e) {
      e.preventDefault();
      var button = bulletin.querySelector('button');
      button.disabled = true;
      button.textContent = 'Signing up...';
      var data = new FormData(bulletin);
      data.append('ajax', '1');
      fetch(bulletin.action, { method: 'POST', body: data, mode: 'no-cors' })
        .then(function () {
          bulletin.innerHTML = '<p style="font-size:1rem;font-weight:700;color:#3D3935;margin:0 0 6px;">Thanks for signing up!</p>' +
            '<p style="font-size:0.9rem;color:#666;line-height:1.7;margin:0;">Keep an eye on your inbox - the next bulletin is on its way.</p>';
        })
        .catch(function () { bulletin.submit(); });
    });
  }

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
    var revealSel = 'section h2, .ministry-card, .give-card, .hub-card, .earlier-card, .insta-grid > a, .belief-card, .flow-step, .stat';
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
