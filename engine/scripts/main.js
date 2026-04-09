(function () {
  // Auto-update copyright year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Navbar scroll shadow
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Mobile hamburger toggle
  var burger = document.getElementById('burgerBtn');
  var mobileNav = document.getElementById('mobileNav');
  burger.addEventListener('click', function () {
    mobileNav.classList.toggle('open');
  });

  // Close mobile nav when a link is clicked
  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileNav.classList.remove('open');
    });
  });

  // Contact form — show success message on submit
  var form = document.getElementById('contactForm');
  var successMsg = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Demo mode: no formAction configured — show success without a real POST
      var actionAttr = form.getAttribute('action');
      if (!actionAttr) {
        form.style.display = 'none';
        successMsg.style.display = 'block';
        return;
      }

      var data = new FormData(form);
      try {
        await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' }
        });
        form.style.display = 'none';
        successMsg.style.display = 'block';
      } catch (err) {
        alert('Something went wrong. Please try WhatsApp instead.');
      }
    });
  }

  // Smooth anchor offset (accounts for fixed navbar)
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = navbar.offsetHeight + 16;
        window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
      }
    });
  });
})();
