document.addEventListener('DOMContentLoaded', () => {
  // Load Navbar
  const navbarContainer = document.getElementById('navbar-container');
  if (navbarContainer) {
    fetch('/components/navbar.html')
      .then(response => response.text())
      .then(data => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        navbarContainer.innerHTML = '';
        while (doc.body.firstChild) {
          navbarContainer.appendChild(doc.body.firstChild);
        }
        
        // Initialize lucide icons after loading content
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }

        // Dynamic Active Tab Highlighting based on pathname
        const currentPath = window.location.pathname;
        const navLinksList = navbarContainer.querySelectorAll('.nav-links a');
        navLinksList.forEach(link => {
          const href = link.getAttribute('href');
          if (href) {
            const isHome = href === '/' || href === '/home/' || href === '/home/index.html';
            const isCurrentHome = currentPath === '/' || currentPath === '/home/' || currentPath.endsWith('/home/') || currentPath.endsWith('/home/index.html') || currentPath === '';
            
            if (isHome && isCurrentHome) {
              link.classList.add('active');
            } else if (!isHome && href !== '#' && (currentPath === href || currentPath.endsWith(href) || currentPath.includes(href))) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          }
        });

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
              document.body.style.overflow = 'hidden'; // Lock background body scroll
            } else {
              document.body.style.overflow = '';
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
              document.body.style.overflow = ''; // Unlock background body scroll
              
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
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        footerContainer.innerHTML = '';
        while (doc.body.firstChild) {
          footerContainer.appendChild(doc.body.firstChild);
        }
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

  // Testimonials Carousel for mobile viewports
  const testimonialsRow = document.querySelector('.testimonials-row');
  const prevBtn = document.querySelector('.pag-arrow.prev');
  const nextBtn = document.querySelector('.pag-arrow.next');
  const dots = document.querySelectorAll('.pag-dots .dot');
  
  if (testimonialsRow && prevBtn && nextBtn && dots.length > 0) {
    let currentIndex = 0;
    const totalCards = dots.length; // 3 cards
    
    function updateCarousel(index) {
      currentIndex = index;
      
      // Update transform position
      if (window.innerWidth <= 768) {
        // Since we set width: 300% on the row, we translate by 33.3333% per card slot
        const translateXValue = -(currentIndex * 33.3333);
        testimonialsRow.style.setProperty('transform', `translateX(${translateXValue}%)`, 'important');
      } else {
        testimonialsRow.style.removeProperty('transform');
      }
      
      // Update dots active class
      dots.forEach((dot, idx) => {
        if (idx === currentIndex) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
    
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      let nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = totalCards - 1; // loop back
      }
      updateCarousel(nextIndex);
    });
    
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      let nextIndex = currentIndex + 1;
      if (nextIndex >= totalCards) {
        nextIndex = 0; // loop back
      }
      updateCarousel(nextIndex);
    });
    
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        updateCarousel(idx);
      });
    });

    // Reset layout transform when resizing window back to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        testimonialsRow.style.removeProperty('transform');
      } else {
        updateCarousel(currentIndex);
      }
    });
  }
});
