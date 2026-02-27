/* ========== 1. Alert (अंत में लोड करना बेहतर है) ========== */
window.onload = () => {
  console.log("Portal Loaded Successfully");
};

/* ========== 2. Smooth Scroll (बेहतर सपोर्ट के साथ) ========== */
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 70, // हेडर की ऊंचाई के हिसाब से एडजस्ट करें
          behavior: 'smooth'
        });
      }
    }
  });
});

/* ========== 3. Active Nav Highlight (Optimized) ========== */
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav a');

window.addEventListener('scroll', () => {
  let current = '';
  // pageYOffset की जगह window.scrollY का उपयोग
  const scrollPos = window.scrollY || document.documentElement.scrollTop;

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    if (scrollPos >= sectionTop) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === `#${current}`) {
      a.classList.add('active');
    }
  });
});

/* ========== 4. 3D Hover Effect (Performance Optimized) ========== */
document.querySelectorAll('.portal-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = ((y / rect.height) - 0.3) * 10; // थोड़ा ज्यादा रोटेशन
    const rotateY = ((x / rect.width) - 0.3) * -10;

    // requestAnimationFrame का उपयोग करना परफॉरमेंस के लिए अच्छा है
    requestAnimationFrame(() => {
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  });
});

/* ========== 5. Logo Pulse (CSS से करना बेहतर है, पर JS सुधार यहाँ है) ========== */
const logo = document.querySelector('.mainlogo');
if (logo) {
  logo.style.transition = "transform 0.3s ease-in-out";
  setInterval(() => {
    logo.style.transform = 'scale(1.1)';
    setTimeout(() => { logo.style.transform = 'scale(1)'; }, 300);
  }, 3000);
}

/* ========== 6. Footer & Error Handlers ========== */
const footer = document.querySelector('footer');
if (footer) {
  footer.innerHTML = `© ${new Date().getFullYear()} | © 2025 • Toolhub.Ap • official developr- Abhishek • आधिकारिक • 100% सुरक्षित`;
}

document.querySelectorAll('img').forEach(img => {
  img.onerror = () => {
    img.src = 'https://via.placeholder.com/150?text=Error'; // बैकअप इमेज लिंक
  };
});