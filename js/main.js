document.addEventListener('DOMContentLoaded', () => {
  // Load Navbar
  const navbarContainer = document.getElementById('navbar-container');
  if (navbarContainer) {
    const initNavbarBehavior = (container) => {
      // Initialize lucide icons after loading content
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }

      // Dynamic Active Tab Highlighting based on pathname
      const currentPath = window.location.pathname;
      const navLinksList = container.querySelectorAll('.nav-links a');
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
      const dropdowns = container.querySelectorAll('.dropdown');
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
    };

    if (navbarContainer.children.length === 0) {
      fetch('/components/navbar.php?v=1.1.8')
        .then(response => response.text())
        .then(data => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, 'text/html');
          navbarContainer.innerHTML = '';
          while (doc.body.firstChild) {
            navbarContainer.appendChild(doc.body.firstChild);
          }
          initNavbarBehavior(navbarContainer);
        })
        .catch(error => console.error('Error loading navbar:', error));
    } else {
      initNavbarBehavior(navbarContainer);
    }
  } else {
    // If no container, just init icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Load Footer
  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    const initFooterBehavior = (container) => {
      if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 50);
      }
      const yearSpan = document.getElementById('current-year');
      if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
      }
    };

    if (footerContainer.children.length === 0) {
      fetch('/components/footer.php?v=1.1.8')
        .then(response => response.text())
        .then(data => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, 'text/html');
          footerContainer.innerHTML = '';
          while (doc.body.firstChild) {
            footerContainer.appendChild(doc.body.firstChild);
          }
          initFooterBehavior(footerContainer);
        })
        .catch(error => console.error('Error loading footer:', error));
    } else {
      initFooterBehavior(footerContainer);
    }
  }

  // Stats Animation using Intersection Observer (Supports integers, decimals, and multiple sections)
  const statCounts = document.querySelectorAll('.stat-count');
  if (statCounts.length > 0) {
    const observerOptions = {
      threshold: 0.1 // Triggers animation as soon as 10% of the stat-count element is visible
    };

    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stat = entry.target;
          observer.unobserve(stat); // Animate once only

          const targetValue = stat.getAttribute('data-target');
          const isDecimal = targetValue.includes('.');
          const target = isDecimal ? parseFloat(targetValue) : parseInt(targetValue, 10);

          const duration = 2000; // 2 seconds
          const frameDuration = 1000 / 60; // 60fps
          const totalFrames = Math.round(duration / frameDuration);
          let frame = 0;

          const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const easeOutProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
            
            let currentCount = isDecimal
              ? (target * easeOutProgress).toFixed(1)
              : Math.round(target * easeOutProgress);
            
            // Format integer values >= 1000 with commas
            if (!isDecimal && target >= 1000) {
              currentCount = Math.round(target * easeOutProgress).toLocaleString();
            }

            stat.innerText = currentCount;

            if (frame === totalFrames) {
              clearInterval(counter);
              stat.innerText = isDecimal ? target.toFixed(1) : target.toLocaleString();
            }
          }, frameDuration);
        }
      });
    }, observerOptions);

    statCounts.forEach(stat => {
      countObserver.observe(stat);
    });
  }

  // Testimonials Carousel (Web View: 3 visible with manual controls; Mobile: auto-scrolling marquee)
  const testimonialsRow = document.querySelector('.testimonials-row');
  const prevBtn = document.querySelector('.pag-arrow.prev');
  const nextBtn = document.querySelector('.pag-arrow.next');
  const dotsContainer = document.querySelector('.pag-dots');
  
  if (testimonialsRow) {
    const originalCards = Array.from(testimonialsRow.children);
    const totalOriginal = originalCards.length;

    // Clone cards for mobile marquee (only do this once)
    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.classList.add('clone');
      testimonialsRow.appendChild(clone);
    });

    // Ensure all completed images have the 'loaded' class (for cache or clones)
    const testimonialAvatars = testimonialsRow.querySelectorAll('.testimonial-avatar');
    testimonialAvatars.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      }
      img.addEventListener('load', () => {
        img.classList.add('loaded');
      });
    });

    let currentIndex = 0;
    let dots = [];

    function setupDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      
      if (window.innerWidth > 1300) {
        // Desktop: 3 visible at a time. Steps = totalOriginal - 3 + 1
        const steps = Math.max(1, totalOriginal - 3 + 1);
        for (let i = 0; i < steps; i++) {
          const dot = document.createElement('span');
          dot.className = 'dot' + (i === currentIndex ? ' active' : '');
          dot.addEventListener('click', (e) => {
            e.preventDefault();
            updateCarousel(i);
          });
          dotsContainer.appendChild(dot);
        }
        dots = Array.from(dotsContainer.children);
      }
    }

    function updateCarousel(index) {
      if (window.innerWidth > 1300) {
        const steps = Math.max(1, totalOriginal - 3 + 1);
        // Clamp index
        currentIndex = Math.max(0, Math.min(index, steps - 1));

        // Calculate exact translate value based on card width + gap
        const cards = testimonialsRow.querySelectorAll('.testimonial-card:not(.clone)');
        if (cards.length > 0) {
          const cardWidth = cards[0].getBoundingClientRect().width;
          const gap = parseFloat(window.getComputedStyle(testimonialsRow).gap) || 0;
          const translateXValue = -currentIndex * (cardWidth + gap);
          testimonialsRow.style.setProperty('transform', `translateX(${translateXValue}px)`);
        }
      } else {
        // Mobile: marquee takes care of movement via CSS animation
        testimonialsRow.style.removeProperty('transform');
      }

      // Update active dot
      if (dots.length > 0) {
        dots.forEach((dot, idx) => {
          if (idx === currentIndex) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      }
    }

    // Event listeners for arrows (Desktop only)
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.innerWidth > 1300) {
          updateCarousel(currentIndex - 1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.innerWidth > 1300) {
          const steps = Math.max(1, totalOriginal - 3 + 1);
          let nextIndex = currentIndex + 1;
          if (nextIndex >= steps) {
            nextIndex = 0; // loop back
          }
          updateCarousel(nextIndex);
        }
      });
    }

    // Initial Setup
    setupDots();
    updateCarousel(currentIndex);

    // Handle resize
    window.addEventListener('resize', () => {
      setupDots();
      updateCarousel(currentIndex);
    });
  }

  // Scroll Spy: Update URL hash seamlessly as sections enter viewport
  const scrollSections = document.querySelectorAll('section[id]');
  
  if (scrollSections.length > 0) {
    const scrollObserverOptions = {
      root: null,
      rootMargin: '-30% 0px -60% 0px', // Triggers when the section occupies the center third of viewport
      threshold: 0
    };
    
    let lastActiveHash = '';
    
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('id');
          const newHash = `#${sectionId}`;
          
          if (newHash !== lastActiveHash) {
            lastActiveHash = newHash;
            // Update URL hash without causing a page snap scroll jump
            window.history.replaceState(null, null, newHash);
          }
        }
      });
    }, scrollObserverOptions);
    
    scrollSections.forEach(section => {
      scrollObserver.observe(section);
    });
  }

  // Load Corporate Partners Marquee
  const marqueeContainer = document.getElementById('marquee-container');
  if (marqueeContainer && marqueeContainer.children.length === 0) {
    fetch('/components/companies-marquee.php?v=1.2.1')
      .then(response => response.text())
      .then(data => {
        marqueeContainer.innerHTML = data;
      })
      .catch(error => console.error('Error loading marquee:', error));
  }

  // Smooth details accordion for FAQ Items
  class Accordion {
    constructor(el) {
      this.el = el;
      this.summary = el.querySelector('summary');
      this.content = el.querySelector('.faq-answer');
      
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      
      if (this.el.open) {
        this.el.classList.add('is-active');
      }
      
      this.summary.addEventListener('click', (e) => this.onClick(e));
    }
    
    onClick(e) {
      e.preventDefault();
      this.el.style.overflow = 'hidden';
      if (this.isClosing || !this.el.open) {
        this.open();
      } else if (this.isExpanding || this.el.open) {
        this.shrink();
      }
    }
    
    shrink() {
      this.isClosing = true;
      this.el.classList.remove('is-active');
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight}px`;
      
      if (this.animation) {
        this.animation.cancel();
      }
      
      this.animation = this.el.animate({
        height: [startHeight, endHeight]
      }, {
        duration: 250,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
      });
      
      this.animation.onfinish = () => this.onAnimationFinish(false);
      this.animation.oncancel = () => this.isClosing = false;
    }
    
    open() {
      this.el.style.height = `${this.el.offsetHeight}px`;
      this.el.open = true;
      this.el.classList.add('is-active');
      window.requestAnimationFrame(() => this.expand());
    }
    
    expand() {
      this.isExpanding = true;
      const startHeight = `${this.el.offsetHeight}px`;
      const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;
      
      if (this.animation) {
        this.animation.cancel();
      }
      
      this.animation = this.el.animate({
        height: [startHeight, endHeight]
      }, {
        duration: 250,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
      });
      
      this.animation.onfinish = () => this.onAnimationFinish(true);
      this.animation.oncancel = () => this.isExpanding = false;
    }
    
    onAnimationFinish(open) {
      this.el.open = open;
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      this.el.style.height = '';
      this.el.style.overflow = '';
      
      if (open) {
        this.el.classList.add('is-active');
      } else {
        this.el.classList.remove('is-active');
      }
    }
  }

  window.Accordion = Accordion;

  document.querySelectorAll('.faq-item').forEach((el) => {
    new Accordion(el);
  });

  // Why ACCA Cards mobile click interaction
  const whyAccaCards = document.querySelectorAll('.why-acca-card');
  if (whyAccaCards.length > 0) {
    whyAccaCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Toggle active class on mobile/touch screens (viewport <= 1024px or pointer: coarse device)
        if (window.innerWidth <= 1024 || window.matchMedia("(pointer: coarse)").matches) {
          const isActive = card.classList.contains('active');
          
          // Remove active class from all other why-acca cards
          whyAccaCards.forEach(c => c.classList.remove('active'));
          
          if (!isActive) {
            card.classList.add('active');
          }
        }
      });
    });

    // Clear active class when clicking outside cards
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.why-acca-card')) {
        whyAccaCards.forEach(c => c.classList.remove('active'));
      }
    });
  }

  // ACCA Journey Cards mobile click interaction
  const journeyCards = document.querySelectorAll('.journey-modern-card');
  if (journeyCards.length > 0) {
    journeyCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Toggle active class on mobile/touch screens (viewport <= 1024px or pointer: coarse device)
        if (window.innerWidth <= 1024 || window.matchMedia("(pointer: coarse)").matches) {
          const isActive = card.classList.contains('active');
          
          // Remove active class from all other journey cards
          journeyCards.forEach(c => c.classList.remove('active'));
          
          if (!isActive) {
            card.classList.add('active');
          }
        }
      });
    });

    // Clear active class when clicking outside cards
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.journey-modern-card')) {
        journeyCards.forEach(c => c.classList.remove('active'));
      }
    });
  }
});

// Reusable Dynamic Toast Notification System
window.showToast = function (message, type = 'success') {
  // 1. Ensure CSS is injected
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 380px;
        width: calc(100% - 48px);
      }
      .toast-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(0, 0, 0, 0.05);
        transform: translateX(120%);
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
        opacity: 0;
        cursor: pointer;
        user-select: none;
      }
      .toast-item.active {
        transform: translateX(0);
        opacity: 1;
      }
      .toast-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .toast-item.success .toast-icon {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }
      .toast-item.error .toast-icon {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
      .toast-message {
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
        line-height: 1.4;
      }
      @media (max-width: 480px) {
        .toast-container {
          top: 16px;
          right: 24px;
          left: 24px;
          width: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Ensure Container exists
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // 3. Create Toast Item
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;

  const iconDiv = document.createElement('div');
  iconDiv.className = 'toast-icon';
  const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
  iconDiv.innerHTML = `<i data-lucide="${iconName}"></i>`;

  const msgDiv = document.createElement('div');
  msgDiv.className = 'toast-message';
  msgDiv.textContent = message;

  toast.appendChild(iconDiv);
  toast.appendChild(msgDiv);
  container.appendChild(toast);

  // Initialize lucide icons for the toast
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({
      attrs: {
        style: 'width: 16px; height: 16px; stroke-width: 2.5px;'
      },
      nameAttr: 'data-lucide',
      node: toast
    });
  }

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.add('active');
  });

  // Auto-dismiss helper
  let dismissTimeout = setTimeout(dismiss, 4000);

  function dismiss() {
    toast.classList.remove('active');
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }

  // Click to dismiss
  toast.addEventListener('click', () => {
    clearTimeout(dismissTimeout);
    dismiss();
  });
};
