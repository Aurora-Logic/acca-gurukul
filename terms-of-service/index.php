<!doctype html>
<html lang="en">
  <head>
<?php
require_once __DIR__ . '/../components/seo.php';
seo_head('terms-of-service');
?>
    <link rel="icon" type="image/png" href="/favicon.png" />

    <!-- Google Fonts Preconnect & Links -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
      rel="stylesheet"
    />

    <!-- Stylesheets -->
    <link rel="stylesheet" href="/css/style.css?v=1.1.6" />
    <link rel="stylesheet" href="/css/legal.css?v=1.0.0" />
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest" defer></script>
  </head>
  <body>
    <!-- Navbar Placeholder -->
    <nav id="navbar-container" class="navbar"><?php include __DIR__ . '/../components/navbar.html'; ?></nav>

    <!-- Hero Section -->
    <header class="section-legal-hero">
      <div class="container">
        <div class="legal-hero-wrapper">
          <span class="legal-eyebrow">LEGAL AGREEMENT</span>
          <h1 class="legal-hero-title">Terms of <span>Service</span></h1>
          <p class="legal-hero-desc">
            Please read these terms carefully. By accessing our services, you agree to comply with this agreement.
          </p>
        </div>
      </div>
    </header>

    <!-- Content Section -->
    <main class="section-legal-content">
      <div class="container">
        <article class="legal-content-card">
          
          <div class="legal-text-block">
            <h2>Terms of Service</h2>
            
            <ul class="legal-bullet-list">
              <li>
                <strong>Acceptance of Terms</strong><br>
                By accessing or using ACCA Gurukul's website, services, courses, learning platforms, and educational resources, you agree to comply with these Terms of Service.
              </li>
              <li>
                <strong>Services</strong><br>
                ACCA Gurukul, a brand owned and operated by Jiyarah Ventures LLP, provides educational programs, professional training, career guidance, and related services.
              </li>
              <li>
                <strong>User Responsibilities</strong><br>
                Users agree to provide accurate information, maintain confidentiality of account credentials, and use the services only for lawful purposes.
              </li>
              <li>
                <strong>Intellectual Property</strong><br>
                All course content, study materials, videos, presentations, branding, and website content remain the intellectual property of Jiyarah Ventures LLP unless otherwise stated.
              </li>
              <li>
                <strong>Prohibited Activities</strong><br>
                Users shall not reproduce, distribute, share, record, sell, or commercially exploit any educational material without prior written consent.
              </li>
              <li>
                <strong>Fees and Payments</strong><br>
                Course fees, enrollment charges, and other payments must be made according to the agreed payment schedule. Failure to pay may result in suspension of services.
              </li>
              <li>
                <strong>No Refund Policy</strong><br>
                We do not offer refunds, returns, replacements, or exchanges for any
                product and/or service purchased on the Platform, including but not
                limited to cases of dissatisfaction, change of mind, perceived value,
                non-usage, or misunderstanding of the offering.
              </li>
              <li>
                <strong>Termination</strong><br>
                ACCA Gurukul reserves the right to suspend or terminate access to its services for violations of these terms.
              </li>
              <li>
                <strong>Governing Law</strong><br>
                These Terms shall be governed by the laws of India, and disputes shall be subject to the exclusive jurisdiction of the courts of Nashik, Maharashtra.
              </li>
            </ul>
          </div>

        </article>
      </div>
    </main>

    <!-- Footer Placeholder -->
    <footer id="footer-container" class="footer"><?php include __DIR__ . '/../components/footer.html'; ?></footer>

    <!-- Main JavaScript Scripts -->
    <script src="/js/main.js"></script>
    <script src="/js/counselling-modal.js"></script>
  </body>
</html>
