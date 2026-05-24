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
      })
      .catch(error => console.error('Error loading navbar:', error));
  } else {
    // If no container, just init icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Same logic would apply for footer if needed
});
