document.addEventListener('DOMContentLoaded', () => {
  // Load Navbar
  const navbarContainer = document.getElementById('navbar-container');
  if (navbarContainer) {
    fetch('/components/navbar.html')
      .then(response => response.text())
      .then(data => {
        navbarContainer.innerHTML = data;
        
        // Initialize lucide icons after loading content
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }

        // Toggle Hamburger Menu for Mobile Responsiveness
        const toggleBtn = document.getElementById('nav-toggle-btn');
        const navMenu = document.getElementById('nav-links-menu');
        const toggleIcon = document.getElementById('nav-toggle-icon');

        if (toggleBtn && navMenu) {
          toggleBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            const isOpened = navMenu.classList.contains('active');
            if (isOpened) {
              toggleBtn.style.setProperty('display', 'none', 'important');
            }
            
            if (toggleIcon) {
              toggleIcon.setAttribute('data-lucide', isOpened ? 'x' : 'menu');
              if (typeof lucide !== 'undefined') {
                lucide.createIcons();
              }
            }
          });

          const closeBtn = document.getElementById('nav-close-btn');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              navMenu.classList.remove('active');
              toggleBtn.style.removeProperty('display');
              
              if (toggleIcon) {
                toggleIcon.setAttribute('data-lucide', 'menu');
                if (typeof lucide !== 'undefined') {
                  lucide.createIcons();
                }
              }
            });
          }
        }

        // Mobile dropdown toggles
        const dropdowns = navbarContainer.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
          const trigger = dropdown.querySelector('.dropdown-trigger');
          if (trigger) {
            trigger.addEventListener('click', (e) => {
              if (window.innerWidth <= 1024) {
                e.preventDefault();
                dropdown.classList.toggle('active');
              }
            });
          }
        });
      })
      .catch(error => console.error('Error loading navbar:', error));
  } else {
    // If no container, just init icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Load Footer
  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    fetch('/components/footer.html')
      .then(response => response.text())
      .then(data => {
        footerContainer.innerHTML = data;
        if (typeof lucide !== 'undefined') {
          setTimeout(() => lucide.createIcons(), 50);
        }
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) {
          yearSpan.textContent = new Date().getFullYear();
        }
      })
      .catch(error => console.error('Error loading footer:', error));
  }

  // Stats Animation using Intersection Observer
  const statsSection = document.querySelector('.why-acca-stats');
  const statCounts = document.querySelectorAll('.stat-count');
  let animated = false;

  if (statsSection && statCounts.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        statCounts.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'), 10);
          const duration = 2000; // 2 seconds
          const frameDuration = 1000 / 60; // 60fps
          const totalFrames = Math.round(duration / frameDuration);
          let frame = 0;

          const counter = setInterval(() => {
            frame++;
            // Use easeOutQuart for a smoother slowdown at the end
            const progress = frame / totalFrames;
            const easeOutProgress = 1 - Math.pow(1 - progress, 4);
            const currentCount = Math.round(target * easeOutProgress);
            
            // Format with commas if >= 1000
            stat.innerText = currentCount.toLocaleString();

            if (frame === totalFrames) {
              clearInterval(counter);
              stat.innerText = target.toLocaleString();
            }
          }, frameDuration);
        });
      }
    }, { threshold: 0.5 }); // Start when 50% visible

    observer.observe(statsSection);
  }
});
