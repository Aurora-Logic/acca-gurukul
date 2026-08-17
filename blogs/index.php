<?php
// blogs/index.php
require_once __DIR__ . '/../api/config/bootstrap.php';
require_once __DIR__ . '/../components/seo.php';
header('Content-Type: text/html; charset=utf-8');

// Helper function to escape html
function h($str) {
    return htmlspecialchars((string)$str, ENT_QUOTES, 'UTF-8');
}

function formatDate($dateStr) {
    if (!$dateStr) return '';
    $date = new DateTime($dateStr);
    return $date->format('M d, Y');
}

// Get the slug parameter
$slug = trim((string)($_GET['slug'] ?? ''));
$slugDecoded = html_entity_decode($slug, ENT_QUOTES, 'UTF-8');
$slugEncoded = htmlspecialchars($slugDecoded, ENT_QUOTES, 'UTF-8');

$blog = null;
$tocItems = [];
$faqs = [];
$notFound = false;

if ($slugDecoded) {
    // 1. Fetch single published blog
    try {
        $stmt = db()->prepare('
            SELECT * FROM `blogs` 
            WHERE (slug = :slug OR slug = :slug_encoded) AND is_published = 1
            LIMIT 1
        ');
        $stmt->execute([
            ':slug' => $slugDecoded,
            ':slug_encoded' => $slugEncoded
        ]);
        $blog = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($blog) {
            // Track page view
            $ip = getClientIp();
            $userAgent = sanitize($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');
            try {
                $viewStmt = db()->prepare('
                    INSERT IGNORE INTO `blog_views` (blog_id, ip_address, user_agent, viewed_at)
                    VALUES (:blog_id, :ip, :ua, NOW())
                ');
                $viewStmt->execute([
                    ':blog_id' => (int)$blog['id'],
                    ':ip' => $ip,
                    ':ua' => $userAgent
                ]);

                if ($viewStmt->rowCount() > 0) {
                    $updateViews = db()->prepare('UPDATE `blogs` SET views = views + 1 WHERE id = :id');
                    $updateViews->execute([':id' => (int)$blog['id']]);
                    $blog['views'] = (int)$blog['views'] + 1;
                }
            } catch (PDOException $ve) {
                error_log('blog views tracking error: ' . $ve->getMessage());
            }

            // Parse content for Table of Contents
            if ($blog['show_toc']) {
                $blog['content'] = generateTocAndInjectIds($blog['content'], $tocItems);
            }
            
            // Parse FAQs
            if (!empty($blog['faqs'])) {
                $faqs = json_decode($blog['faqs'], true);
                if (!is_array($faqs)) {
                    $faqs = [];
                }
            }
        } else {
            // Blog slug provided but not found, send 404
            http_response_code(404);
            $notFound = true;
        }
    } catch (PDOException $e) {
        error_log('blogs/index SSR fetch error: ' . $e->getMessage());
        http_response_code(500);
    }
}

// Function to generate TOC and inject heading IDs
function generateTocAndInjectIds($content, &$tocItems) {
    $tocItems = [];
    // Match h2 and h3 tags
    $pattern = '/<h([23])\b([^>]*)>(.*?)<\/h[23]>/i';
    
    $contentWithIds = preg_replace_callback($pattern, function($matches) use (&$tocItems) {
        $level = intval($matches[1]);
        $attrs = $matches[2];
        $text = strip_tags($matches[3]);
        
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $text), '-'));
        if (!$slug) {
            $slug = 'heading-' . count($tocItems);
        }
        
        $originalSlug = $slug;
        $counter = 1;
        while (isset($tocItems[$slug])) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        $tocItems[$slug] = [
            'text' => $text,
            'level' => $level,
            'id' => $slug
        ];
        
        // If an id attribute already exists, return it unchanged
        if (preg_match('/\bid\s*=\s*[\'"]/i', $attrs)) {
            return $matches[0];
        }
        
        return "<h{$level} id=\"{$slug}\"{$attrs}>{$matches[3]}</h{$level}>";
    }, $content);
    
    return $contentWithIds;
}
?>
<!doctype html>
<html lang="en">
  <head>
<?php
if ($blog) {
    // Article URLs are built from the stored slug, never from REQUEST_URI —
    // that header is attacker-controlled and previously landed unescaped in
    // og:url. Deriving it from the database also keeps query strings and
    // casing variants from splitting the canonical.
    $blogUrl   = seo_url('/blogs/' . rawurlencode($blog['slug']) . '/');
    $blogTitle = $blog['meta_title'] ?: $blog['title'];
    $blogDesc  = $blog['meta_description'] ?: $blog['excerpt'];
    $blogImage = $blog['featured_image'] ?: '/assets/images/building.webp';

    $article = [
        '@type'            => 'BlogPosting',
        '@id'              => $blogUrl . '#article',
        'headline'         => mb_substr($blog['title'], 0, 110),
        'url'              => $blogUrl,
        'mainEntityOfPage' => ['@id' => $blogUrl . '#webpage'],
        'image'            => seo_url($blogImage),
        'datePublished'    => (new DateTime($blog['created_at']))->format(DateTime::ATOM),
        'dateModified'     => (new DateTime($blog['updated_at'] ?: $blog['created_at']))->format(DateTime::ATOM),
        'publisher'        => ['@id' => seo_url('/') . '#organization'],
        'inLanguage'       => 'en-IN',
    ];
    if (!empty($blogDesc))            $article['description'] = $blogDesc;
    if (!empty($blog['author']))      $article['author'] = ['@type' => 'Person', 'name' => $blog['author']];
    else                              $article['author'] = ['@id' => seo_url('/') . '#organization'];
    if (!empty($blog['category']))    $article['articleSection'] = $blog['category'];
    if (!empty($blog['tags']))        $article['keywords'] = $blog['tags'];
    if (!empty($blog['read_time']))   $article['timeRequired'] = 'PT' . (int) $blog['read_time'] . 'M';

    $extraSchema = [$article, [
        '@type'           => 'BreadcrumbList',
        '@id'             => $blogUrl . '#breadcrumb',
        'itemListElement' => [
            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home',  'item' => seo_url('/')],
            ['@type' => 'ListItem', 'position' => 2, 'name' => 'Blog',  'item' => seo_url('/blogs/')],
            ['@type' => 'ListItem', 'position' => 3, 'name' => $blog['title'], 'item' => $blogUrl],
        ],
    ]];

    if (!empty($faqs)) {
        $questions = [];
        foreach ($faqs as $faq) {
            if (empty($faq['question']) || empty($faq['answer'])) {
                continue;
            }
            $questions[] = [
                '@type'          => 'Question',
                'name'           => $faq['question'],
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $faq['answer']],
            ];
        }
        if ($questions) {
            $extraSchema[] = [
                '@type'      => 'FAQPage',
                '@id'        => $blogUrl . '#faq',
                'mainEntity' => $questions,
            ];
        }
    }

    seo_head('blogs', [
        'path'             => '/blogs/' . $blog['slug'] . '/',
        'label'            => $blog['title'],
        'meta_title'       => $blogTitle . ' | ACCA Gurukul',
        'meta_description' => $blogDesc,
        'canonical_url'    => $blogUrl,
        'og_title'         => $blog['og_title'] ?: $blogTitle,
        'og_description'   => $blog['og_description'] ?: $blogDesc,
        'og_image'         => $blogImage,
        'og_image_alt'     => $blog['featured_image_alt'] ?? '',
        'og_type'          => 'article',
        'structured_data'  => '',
        'schema'           => $extraSchema,
    ]);
} elseif ($notFound) {
    // A missing article still renders the listing, so without this the 404 URL
    // would advertise itself as indexable and canonicalise to /blogs/ — telling
    // Google it is a duplicate of a page that does exist.
    seo_head('blogs', [
        'meta_title'     => 'Article not found | ACCA Gurukul',
        'robots_noindex' => 1,
        'canonical_url'  => seo_url('/blogs/' . rawurlencode($slugDecoded) . '/'),
    ]);
} else {
    seo_head('blogs');
}
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
    <link rel="stylesheet" href="/css/blogs.css?v=1.1.7" />
    <script src="/js/tracking.js" defer></script>
    <script src="https://unpkg.com/lucide@latest" defer></script>
  </head>
  <body>
    <!-- Navbar Placeholder -->
    <nav id="navbar-container" class="navbar"><?php include __DIR__ . '/../components/navbar.php'; ?></nav>

    <?php if ($blog): ?>
      <!-- ═══════════════════════════════════════════
           SINGLE BLOG DETAIL VIEW (SSR)
           ═══════════════════════════════════════════ -->
      <section class="section-blog-detail">
        <div class="container blog-detail-container">
          <a href="/blogs/" class="back-to-blogs">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> Back to Articles
          </a>
          
          <div class="blog-meta-row">
            <span class="blog-category-tag"><?php echo h($blog['category']); ?></span>
            <span class="blog-meta-dot"></span>
            <span><?php echo formatDate($blog['created_at']); ?></span>
            <span class="blog-meta-dot"></span>
            <span><?php echo h($blog['read_time']); ?> Min Read</span>
          </div>
          
          <h1 class="single-blog-title"><?php echo h($blog['title']); ?></h1>
          
          <?php if ($blog['author']): ?>
            <div class="blog-author-row" style="margin-bottom: 24px; color: var(--color-gray); font-size: 0.9rem; font-family: var(--font-sans);">
                By <strong><?php echo h($blog['author']); ?></strong>
            </div>
          <?php endif; ?>

          <div class="single-blog-image">
            <img src="<?php echo h($blog['featured_image'] ?: '/assets/images/building.webp'); ?>" alt="<?php echo h($blog['featured_image_alt'] ?: $blog['title']); ?>" />
          </div>
          
          <!-- Layout Grid for TOC + Content -->
          <div class="blog-content-layout">
            
            <?php if (!empty($tocItems)): ?>
              <!-- Table of Contents Sidebar -->
              <aside class="blog-sidebar-toc">
                <div class="blog-toc-card">
                  <h4 class="toc-title">Table of Contents</h4>
                  <ul class="toc-list">
                    <?php foreach ($tocItems as $item): ?>
                      <li class="toc-item toc-level-<?php echo $item['level']; ?>">
                        <a href="#<?php echo $item['id']; ?>"><?php echo h($item['text']); ?></a>
                      </li>
                    <?php endforeach; ?>
                  </ul>
                </div>
              </aside>
            <?php endif; ?>

            <!-- Blog Post Body -->
            <article class="single-blog-body prose">
              <?php echo $blog['content']; ?>
            </article>
          </div>

          <!-- FAQ Section Accordion -->
          <?php if (!empty($faqs)): ?>
            <section class="blog-faqs-section">
              <h3 class="faqs-section-title">Frequently Asked Questions</h3>
              <div class="faq-accordion-container">
                <?php foreach ($faqs as $index => $faq): ?>
                  <details class="faq-item">
                    <summary class="faq-question">
                      <?php echo h($faq['question']); ?>
                      <i data-lucide="chevron-down" class="faq-chevron"></i>
                    </summary>
                    <div class="faq-answer">
                      <p><?php echo nl2br(h($faq['answer'])); ?></p>
                    </div>
                  </details>
                <?php endforeach; ?>
              </div>
            </section>
          <?php endif; ?>

        </div>
      </section>

    <?php else: ?>
      <!-- ═══════════════════════════════════════════
           BLOGS GRID LIST VIEW (SSR + Client Hydration)
           ═══════════════════════════════════════════ -->
      <!-- Main Blogs Header -->
      <header class="section-blogs-header">
        <div class="container">
          <span class="blogs-eyebrow">GURUKUL INSIGHTS</span>
          <h1 class="blogs-main-title">Knowledge, Guides & Updates</h1>
          <p class="blogs-main-desc">
            Stay ahead in your finance journey with curated exam strategies,
            global career insights, syllabus guides, and successful alumni
            stories.
          </p>
        </div>
      </header>

      <!-- Category Filters -->
      <section class="blogs-filter-container">
        <div class="container">
          <ul class="blogs-categories">
            <li>
              <button class="blog-category-btn active">All Articles</button>
            </li>
            <li><button class="blog-category-btn">Syllabus & Guides</button></li>
            <li><button class="blog-category-btn">Exam Strategies</button></li>
            <li><button class="blog-category-btn">ACCA Updates</button></li>
            <li><button class="blog-category-btn">Careers & Jobs</button></li>
            <li><button class="blog-category-btn">Success Stories</button></li>
          </ul>
        </div>
      </section>

      <!-- Blogs Content -->
      <section class="section-blogs-content">
        <div class="container">
          
          <?php
          // Fetch blogs for list
          $allBlogs = [];
          try {
              $stmt = db()->query('SELECT * FROM `blogs` WHERE is_published = 1 ORDER BY created_at DESC');
              $allBlogs = $stmt->fetchAll(PDO::FETCH_ASSOC);
          } catch (PDOException $e) {
              error_log('blogs/index fetch all error: ' . $e->getMessage());
          }

          if (empty($allBlogs)): ?>
            <div class="blogs-grid-container" style="display:block;">
              <p class="no-data-msg" style="text-align: center; color: var(--color-gray); padding: 40px 20px; font-size: 0.95rem; font-family: var(--font-sans); width: 100%;">No blogs uploaded yet.</p>
            </div>
          <?php else: 
            // Separate featured and regular blogs
            $featured = null;
            foreach ($allBlogs as $b) {
                if ($b['is_featured']) {
                    $featured = $b;
                    break;
                }
            }
            if (!$featured) {
                $featured = $allBlogs[0];
            }
            ?>
            
            <!-- Featured Post Card -->
            <div class="featured-blog-wrapper">
              <a href="/blogs/<?php echo htmlspecialchars(html_entity_decode($featured['slug'], ENT_QUOTES, 'UTF-8'), ENT_COMPAT, 'UTF-8'); ?>/" class="featured-blog-card">
                <div class="featured-img-col">
                  <img src="<?php echo h($featured['featured_image'] ?: '/assets/images/building.webp'); ?>" alt="<?php echo h($featured['featured_image_alt'] ?: $featured['title']); ?>" />
                </div>
                <div class="featured-content-col">
                  <div class="blog-meta-row">
                    <span class="blog-category-tag"><?php echo h($featured['category']); ?></span>
                    <span class="blog-meta-dot"></span>
                    <span><?php echo formatDate($featured['created_at']); ?></span>
                    <span class="blog-meta-dot"></span>
                    <span><?php echo h($featured['read_time']); ?> Min Read</span>
                  </div>
                  <h2 class="featured-title"><?php echo h($featured['title']); ?></h2>
                  <p class="featured-excerpt"><?php echo h($featured['excerpt']); ?></p>
                  <span class="blog-read-more">
                    Read Full Article
                    <i data-lucide="arrow-right" style="width: 14px; height: 14px"></i>
                  </span>
                </div>
              </a>
            </div>

            <!-- Regular Blogs Grid -->
            <div class="blogs-grid-container">
              <?php foreach ($allBlogs as $blogItem): 
                if ($blogItem['id'] === $featured['id']) continue;
                ?>
                <a href="/blogs/<?php echo htmlspecialchars(html_entity_decode($blogItem['slug'], ENT_QUOTES, 'UTF-8'), ENT_COMPAT, 'UTF-8'); ?>/" class="blog-card" data-category="<?php echo h($blogItem['category']); ?>">
                  <div class="blog-card-img">
                    <img src="<?php echo h($blogItem['featured_image'] ?: '/assets/images/building.webp'); ?>" alt="<?php echo h($blogItem['featured_image_alt'] ?: $blogItem['title']); ?>" />
                  </div>
                  <div class="blog-card-content">
                    <div class="blog-meta-row">
                      <span class="blog-category-tag"><?php echo h($blogItem['category']); ?></span>
                      <span class="blog-meta-dot"></span>
                      <span><?php echo h($blogItem['read_time']); ?> Min Read</span>
                    </div>
                    <h3 class="blog-card-title"><?php echo h($blogItem['title']); ?></h3>
                    <p class="blog-card-excerpt"><?php echo h($blogItem['excerpt']); ?></p>
                    <span class="blog-read-more">
                      Read More <i data-lucide="arrow-right" style="width: 12px; height: 12px"></i>
                    </span>
                  </div>
                </a>
              <?php endforeach; ?>
            </div>
          <?php endif; ?>

          <!-- Call to Action Banner -->
          <div class="blog-cta-banner">
            <div class="blog-cta-content">
              <h3 class="blog-cta-title">
                Ready to Design Your ACCA Success Story?
              </h3>
              <p class="blog-cta-desc">
                Book a free counselling session with our academic experts. Clear
                your doubts about study plans, registration cycles, fees, and
                exemptions.
              </p>
            </div>
            <div class="blog-cta-action">
              <a
                href="#book-counselling"
                class="btn blog-cta-btn"
                style="
                  display: inline-flex;
                  align-items: center;
                  gap: 8px;
                  padding: 12px 24px;
                  border-radius: 4px;
                  text-decoration: none;
                "
              >
                <i data-lucide="headset" style="width: 18px; height: 18px"></i>
                BOOK FREE COUNSELLING
              </a>
            </div>
          </div>
        </div>
      </section>
    <?php endif; ?>

    <!-- Footer Placeholder -->
    <footer id="footer-container" class="footer"><?php include __DIR__ . '/../components/footer.php'; ?></footer>

    <!-- Main JavaScript Scripts -->
    <script src="/js/main.js"></script>
    <script src="/js/counselling-modal.js"></script>

    <?php if (!$blog): ?>
      <!-- Dynamic Client Hydration and Filtering for Blog List -->
      <script>
        document.addEventListener("DOMContentLoaded", () => {
          const filterButtons = document.querySelectorAll(".blog-category-btn");
          const blogCards = document.querySelectorAll(".blogs-grid-container .blog-card");
          const featuredWrapper = document.querySelector(".featured-blog-wrapper");

          filterButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
              filterButtons.forEach((b) => b.classList.remove("active"));
              btn.classList.add("active");

              const selectedCategory = btn.textContent.trim();
              
              if (selectedCategory === "All Articles") {
                if (featuredWrapper) featuredWrapper.style.display = "";
                blogCards.forEach(card => card.style.display = "");
              } else {
                if (featuredWrapper) featuredWrapper.style.display = "none";
                
                blogCards.forEach(card => {
                  const cardCategory = card.getAttribute("data-category");
                  if (cardCategory === selectedCategory) {
                    card.style.display = "";
                  } else {
                    card.style.display = "none";
                  }
                });
              }
            });
          });
        });
      </script>
    <?php endif; ?>
  </body>
</html>
