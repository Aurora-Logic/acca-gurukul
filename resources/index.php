<!doctype html>
<html lang="en">
  <head>
<?php
require_once __DIR__ . '/../components/seo.php';
seo_head('resources');
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
    <link rel="stylesheet" href="/css/resources.css?v=1.1.6" />
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest" defer></script>
  </head>
  <body>
    <!-- Navbar Placeholder -->
    <nav id="navbar-container" class="navbar"><?php include __DIR__ . '/../components/navbar.php'; ?></nav>

    <!-- Hero Section -->
    <header class="section-resources-hero">
      <div class="container">
        <div class="resources-hero-wrapper">
          <div class="resources-hero-text">
            <span class="resources-eyebrow">RESOURCES</span>
            <h1 class="resources-hero-title">
              Better Resources. <span>Stronger Results.</span>
            </h1>
            <p class="resources-hero-desc">
              At ACCA Gurukul, we believe the right resources can transform
              preparation into performance. Curated by experts. Designed for
              success. Start your journey with the ultimate preparation toolset.
            </p>

            <!-- Badges Grid inside Hero -->
            <div class="resources-badges-grid">
              <div class="badge-item">
                <div class="badge-icon-wrapper">
                  <i data-lucide="award" style="width: 20px; height: 20px"></i>
                </div>
                <h4 class="badge-title">Expert Curated</h4>
                <p class="badge-desc">High Quality Content</p>
              </div>
              <div class="badge-item">
                <div class="badge-icon-wrapper">
                  <i data-lucide="target" style="width: 20px; height: 20px"></i>
                </div>
                <h4 class="badge-title">Exam Focused</h4>
                <p class="badge-desc">& Relevant Material</p>
              </div>
              <div class="badge-item">
                <div class="badge-icon-wrapper">
                  <i
                    data-lucide="book-open"
                    style="width: 20px; height: 20px"
                  ></i>
                </div>
                <h4 class="badge-title">Practical & Easy</h4>
                <p class="badge-desc">To Understand Concepts</p>
              </div>
              <div class="badge-item">
                <div class="badge-icon-wrapper">
                  <i
                    data-lucide="refresh-cw"
                    style="width: 20px; height: 20px"
                  ></i>
                </div>
                <h4 class="badge-title">Updated</h4>
                <p class="badge-desc">Regularly per Syllabus</p>
              </div>
            </div>
          </div>

          <div class="resources-hero-image">
            <img
              src="/assets/images/resources_hero.webp"
              alt="<?php echo img_alt('/assets/images/resources_hero.webp', 'ACCA Textbooks stack and Laptop'); ?>"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Our Resources Grid -->
    <section class="section-our-resources" id="our-resources">
      <div class="container">
        <div class="section-header">
          <span class="section-header-eyebrow">OUR RESOURCES</span>
          <h2 class="section-header-title">
            Everything You Need. <span>All in One Place.</span>
          </h2>
          <p class="section-header-desc">
            From concept clarity to exam excellence, our resources are built to
            give you an unmatched edge over the rest.
          </p>
        </div>

        <div class="resources-grid">
          <!-- Card 1: Best Tutor Notes -->
          <div class="resource-card">
            <div class="card-header-row">
              <div class="card-icon-wrapper">
                <i
                  data-lucide="book-marked"
                  style="width: 28px; height: 28px"
                ></i>
              </div>
              <div class="card-title-group">
                <span class="card-eyebrow">STUDY GUIDE</span>
                <h3 class="card-title">Best Tutor Notes</h3>
              </div>
            </div>
            <h4 class="card-tagline">
              Concepts Made Simple. Clarity That Lasts.
            </h4>
            <ul class="card-bullets">
              <li>Subject-wise comprehensive tutor notes</li>
              <li>Written by expert faculty with exam-focused approach</li>
              <li>Simple language, effective examples & exam tips</li>
              <li>Perfect blend of theory, practicality & application</li>
              <li>Regularly updated as per ACCA syllabus</li>
            </ul>
            <div class="card-image-wrapper">
              <img
                src="/assets/images/tutor_notes_book.webp"
                alt="<?php echo img_alt('/assets/images/tutor_notes_book.webp', 'ACCA Tutor Notes spiral notebook'); ?>"
              />
            </div>
          </div>

          <!-- Card 2: Premium Textbooks -->
          <div class="resource-card">
            <div class="card-header-row">
              <div class="card-icon-wrapper">
                <i data-lucide="library" style="width: 28px; height: 28px"></i>
              </div>
              <div class="card-title-group">
                <span class="card-eyebrow">TEXTBOOKS</span>
                <h3 class="card-title">Premium Textbooks</h3>
              </div>
            </div>
            <h4 class="card-tagline">Foundation Strong. Understanding Deep.</h4>
            <ul class="card-bullets">
              <li>Recommended global standard textbooks</li>
              <li>In-depth coverage of all ACCA papers</li>
              <li>Conceptual clarity with real world insights</li>
              <li>Exam-style illustrations, diagrams & case studies</li>
              <li>Designed to build strong conceptual base</li>
            </ul>
            <div class="card-image-wrapper">
              <img
                src="/assets/images/textbooks_stack.webp"
                alt="<?php echo img_alt('/assets/images/textbooks_stack.webp', 'Stacked ACCA Textbooks'); ?>"
              />
            </div>
          </div>

          <!-- Card 3: LMS (Learning Management System) -->
          <div class="resource-card">
            <div class="card-header-row">
              <div class="card-icon-wrapper">
                <i data-lucide="laptop" style="width: 28px; height: 28px"></i>
              </div>
              <div class="card-title-group">
                <span class="card-eyebrow">PLATFORM</span>
                <h3 class="card-title">Learning Management System (LMS)</h3>
              </div>
            </div>
            <h4 class="card-tagline">
              Learn. Practice. Improve. Anytime, Anywhere.
            </h4>
            <ul class="card-bullets">
              <li>
                Advanced LMS with
                <span class="highlight">10,000+</span> practice questions
              </li>
              <li>Chapter-wise MCQs, Case scenarios & Past exam questions</li>
              <li>Performance tracking & detailed progress reports</li>
              <li>Personalised study planner</li>
              <li>Doubt support integrated within the platform</li>
              <li>Accessible on Web & Mobile</li>
            </ul>
            <div class="card-image-wrapper">
              <img
                src="/assets/images/lms_dashboard.webp"
                alt="<?php echo img_alt('/assets/images/lms_dashboard.webp', 'LMS Dashboard on Mobile & Laptop'); ?>"
              />
            </div>
          </div>

          <!-- Card 4: Mock Tests -->
          <div class="resource-card">
            <div class="card-header-row">
              <div class="card-icon-wrapper">
                <i
                  data-lucide="file-check"
                  style="width: 28px; height: 28px"
                ></i>
              </div>
              <div class="card-title-group">
                <span class="card-eyebrow">PORTAL</span>
                <h3 class="card-title">Mock Tests Built for Excellence</h3>
              </div>
            </div>
            <h4 class="card-tagline">Simulate. Analyze. Succeed.</h4>
            <ul class="card-bullets">
              <li>Full-length mock tests as per ACCA pattern</li>
              <li>Timed tests to build exam temperament</li>
              <li>Detailed evaluation with performance analysis</li>
              <li>Identify strengths, improve weak areas</li>
              <li>Designed by experts to mirror real exam experience</li>
            </ul>
            <div class="card-image-wrapper">
              <img
                src="/assets/images/mock_test_paper.webp"
                alt="<?php echo img_alt('/assets/images/mock_test_paper.webp', 'Mock exam paper marked with A+'); ?>"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Our Resources Make The Difference Row -->
    <section class="section-difference">
      <div class="container">
        <h3 class="difference-heading">
          Why Our Resources Make The Difference
        </h3>
        <div class="difference-row">
          <div class="difference-item">
            <div class="difference-icon-wrapper">
              <i data-lucide="award" style="width: 22px; height: 22px"></i>
            </div>
            <span class="difference-text"
              >Built by Experts,<br />for Success</span
            >
          </div>
          <div class="difference-item">
            <div class="difference-icon-wrapper">
              <i data-lucide="compass" style="width: 22px; height: 22px"></i>
            </div>
            <span class="difference-text"
              >Exam Oriented,<br />Always Relevant</span
            >
          </div>
          <div class="difference-item">
            <div class="difference-icon-wrapper">
              <i
                data-lucide="trending-up"
                style="width: 22px; height: 22px"
              ></i>
            </div>
            <span class="difference-text"
              >Practical, Conceptual<br />& Industry Aligned</span
            >
          </div>
          <div class="difference-item">
            <div class="difference-icon-wrapper">
              <i
                data-lucide="check-circle"
                style="width: 22px; height: 22px"
              ></i>
            </div>
            <span class="difference-text"
              >Quality Resources<br />Better Results</span
            >
          </div>
          <div class="difference-item">
            <div class="difference-icon-wrapper">
              <i data-lucide="users" style="width: 22px; height: 22px"></i>
            </div>
            <span class="difference-text"
              >Trusted by Thousands<br />of ACCA Students</span
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Competitive Edge Stats Banner -->
    <section class="section-stats-banner">
      <div class="container">
        <div class="stats-banner-container">
          <div class="stats-banner-left">
            <i data-lucide="star" class="stats-banner-star-icon"></i>
            <div class="stats-banner-title-group">
              <h3 class="stats-banner-title">
                Our Resources. Your Competitive Edge.
              </h3>
              <p class="stats-banner-desc">
                The right content, the right practice, the right guidance -
                everything you need to stay ahead and achieve your ACCA goals.
              </p>
            </div>
          </div>

          <div class="stats-banner-right">
            <div class="stat-box">
              <div class="stat-number-wrapper">
                <span class="stat-count" data-target="10000">0</span>+
              </div>
              <span class="stat-box-label">Practice Questions in LMS</span>
            </div>

            <div class="stat-box">
              <div class="stat-number-wrapper">
                <span class="stat-count" data-target="500">0</span>+
              </div>
              <span class="stat-box-label">Mock Tests Attempted Daily</span>
            </div>

            <div class="stat-box">
              <div class="stat-number-wrapper">
                <span class="stat-count" data-target="98">0</span>%
              </div>
              <span class="stat-box-label"
                >Students Recommend Our Resources</span
              >
            </div>

            <div class="stat-box">
              <div class="stat-number-wrapper">
                <span class="stat-count" data-target="100">0</span>%
              </div>
              <span class="stat-box-label">Exam Focused Materials</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Counselling Banner -->
    <section class="course-cta-banner">
      <div class="container">
        <div class="course-cta-content-wrapper">
          <h3 class="course-cta-eyebrow">Begin Your ACCA Journey Today!</h3>
          <p class="course-cta-desc">
            Get expert guidance, personalised mentorship and a clear roadmap to
            global success.
          </p>
          <a
            href="/acca-course/#fee-structure"
            class="btn btn-cta-white"
            style="display: inline-flex; align-items: center; gap: 8px"
          >
            BOOK A COUNSELLING SESSION
            <i data-lucide="arrow-right" style="width: 16px; height: 16px"></i>
          </a>
        </div>
      </div>
    </section>

    <!-- Footer Placeholder -->
    <footer id="footer-container" class="footer"><?php include __DIR__ . '/../components/footer.php'; ?></footer>

    <!-- Main JavaScript Scripts -->
    <script src="/js/main.js"></script>
    <script src="/js/counselling-modal.js"></script>
  </body>
</html>
