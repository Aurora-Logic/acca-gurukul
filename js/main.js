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
            
            if (toggleIcon) {
              const isOpened = navMenu.classList.contains('active');
              toggleIcon.setAttribute('data-lucide', isOpened ? 'x' : 'menu');
              if (typeof lucide !== 'undefined') {
                lucide.createIcons();
              }
            }
          });
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
          lucide.createIcons();
        }
      })
      .catch(error => console.error('Error loading footer:', error));
  }
});
