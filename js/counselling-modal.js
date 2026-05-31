/**
 * Counselling Modal Controller
 * Zero-dependency, reusable modal injector and coordinator.
 */

(function () {
  // 1. Inject CSS stylesheet
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/modal.css';
  document.head.appendChild(link);

  // 2. Define the HTML structure in a template to avoid CORS fetch issues on file:// protocol
  const modalHTML = `
  <div class="counselling-modal-backdrop" id="counsellingModalBackdrop">
    <div class="counselling-modal-container">
      
      <!-- Close Button -->
      <button class="counselling-modal-close" id="counsellingModalClose" aria-label="Close modal">
        <i data-lucide="x"></i>
      </button>

      <div class="counselling-modal-body">
        <!-- Left Column: Form -->
        <div class="counselling-modal-left">
          <h2 class="title">Book a Counselling <span class="session-highlight">Session</span></h2>
          <p class="subtitle">
            Take the first step towards your ACCA journey. Book a free one-on-one session with our experts.
          </p>

          <form class="counselling-form" id="counsellingForm">
            <div class="counselling-form-row">
              <div class="counselling-form-group">
                <label class="counselling-form-label" for="counsellingName">Full Name*</label>
                <input type="text" class="counselling-form-control" id="counsellingName" placeholder="Enter your full name" required>
              </div>
              <div class="counselling-form-group">
                <label class="counselling-form-label" for="counsellingPhone">Phone Number*</label>
                <input type="tel" class="counselling-form-control" id="counsellingPhone" placeholder="Enter your phone number" required>
              </div>
            </div>

            <div class="counselling-form-group">
              <label class="counselling-form-label" for="counsellingEmail">Email Address*</label>
              <input type="email" class="counselling-form-control" id="counsellingEmail" placeholder="Enter your email address" required>
            </div>

            <div class="counselling-form-group">
              <label class="counselling-form-label" for="counsellingCourse">Course Interested In*</label>
              <select class="counselling-form-control" id="counsellingCourse" required>
                <option value="" disabled selected>Select a course</option>
                <option value="acca-knowledge">ACCA Applied Knowledge</option>
                <option value="acca-skills">ACCA Applied Skills</option>
                <option value="acca-professional">ACCA Strategic Professional</option>
                <option value="acca-diploma">Diploma in IFRS</option>
              </select>
            </div>

            <div class="counselling-form-row">
              <div class="counselling-form-group">
                <label class="counselling-form-label" for="counsellingQual">Current Qualification*</label>
                <select class="counselling-form-control" id="counsellingQual" required>
                  <option value="" disabled selected>Select your qualification</option>
                  <option value="undergraduate">Undergraduate (B.Com/BBA/etc.)</option>
                  <option value="graduate">Graduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="ca-ipcc">CA IPCC / CA Inter</option>
                  <option value="ca-final">CA Final / Qualified CA</option>
                  <option value="working-professional">Working Professional</option>
                </select>
              </div>
              <div class="counselling-form-group">
                <label class="counselling-form-label" for="counsellingYear">Year of Passing</label>
                <select class="counselling-form-control" id="counsellingYear">
                  <option value="" disabled selected>Select year</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="before-2023">Before 2023</option>
                </select>
              </div>
            </div>

            <div class="counselling-form-group">
              <label class="counselling-form-label" for="counsellingLocation">Preferred Location*</label>
              <select class="counselling-form-control" id="counsellingLocation" required>
                <option value="" disabled selected>Select your preferred location</option>
                <option value="online">Online / Live Interactive Classes</option>
                <option value="mumbai">Mumbai Center</option>
                <option value="pune">Pune Center</option>
                <option value="delhi">Delhi Center</option>
                <option value="bengaluru">Bengaluru Center</option>
              </select>
            </div>

            <div class="counselling-form-row">
              <div class="counselling-form-group">
                <label class="counselling-form-label" for="counsellingDate">Preferred Date*</label>
                <input type="date" class="counselling-form-control" id="counsellingDate" required>
              </div>
              <div class="counselling-form-group">
                <label class="counselling-form-label" for="counsellingTime">Preferred Time*</label>
                <select class="counselling-form-control" id="counsellingTime" required>
                  <option value="" disabled selected>Select a time slot</option>
                  <option value="morning">Morning (10:00 AM - 1:00 PM)</option>
                  <option value="afternoon">Afternoon (1:00 PM - 4:00 PM)</option>
                  <option value="evening">Evening (4:00 PM - 7:00 PM)</option>
                </select>
              </div>
            </div>

            <div class="counselling-form-group">
              <label class="counselling-form-label" for="counsellingSource">How did you hear about us?</label>
              <select class="counselling-form-control" id="counsellingSource">
                <option value="" disabled selected>Select an option</option>
                <option value="google">Google Search</option>
                <option value="social-media">Social Media (Instagram/LinkedIn)</option>
                <option value="friend-referral">Friend / Alumni Referral</option>
                <option value="newspaper">Newspaper / Flyer</option>
              </select>
            </div>

            <div class="counselling-form-group">
              <label class="counselling-form-label" for="counsellingMsg">Your Message (Optional)</label>
              <textarea class="counselling-form-control" id="counsellingMsg" placeholder="Write your message here..."></textarea>
            </div>

            <div class="counselling-checkbox-group">
              <input type="checkbox" class="counselling-checkbox-input" id="counsellingCheck" required checked>
              <label class="counselling-checkbox-label" for="counsellingCheck">
                I agree to receive updates and information from ACCA Gurukul.
              </label>
            </div>

            <button type="submit" class="counselling-submit-btn">
              <i data-lucide="calendar"></i> Book My Session <i data-lucide="arrow-right"></i>
            </button>

            <div class="counselling-form-note">
              <i data-lucide="lock"></i> Your information is safe with us and will never be shared.
            </div>
          </form>
        </div>

        <!-- Right Column: Benefits list & Helper Cards -->
        <div class="counselling-modal-right">
          <h3 class="right-title">Why <span>Book a Counselling Session?</span></h3>
          <div class="counselling-right-divider">
            <i data-lucide="star"></i>
          </div>

          <div class="counselling-benefits-list">
            <div class="counselling-benefit-item">
              <div class="counselling-benefit-icon">
                <i data-lucide="user-check"></i>
              </div>
              <div class="counselling-benefit-text">
                <div class="counselling-benefit-heading">Personalised Guidance</div>
                <div class="counselling-benefit-desc">Get expert advice tailored to your background and career goals.</div>
              </div>
            </div>

            <div class="counselling-benefit-item">
              <div class="counselling-benefit-icon">
                <i data-lucide="book-open"></i>
              </div>
              <div class="counselling-benefit-text">
                <div class="counselling-benefit-heading">Course & Exam Insights</div>
                <div class="counselling-benefit-desc">Understand the ACCA journey, exam structure, and exemptions.</div>
              </div>
            </div>

            <div class="counselling-benefit-item">
              <div class="counselling-benefit-icon">
                <i data-lucide="trending-up"></i>
              </div>
              <div class="counselling-benefit-text">
                <div class="counselling-benefit-heading">Career Opportunities</div>
                <div class="counselling-benefit-desc">Explore global career paths and industry opportunities.</div>
              </div>
            </div>

            <div class="counselling-benefit-item">
              <div class="counselling-benefit-icon">
                <i data-lucide="dollar-sign"></i>
              </div>
              <div class="counselling-benefit-text">
                <div class="counselling-benefit-heading">Fee & Scholarship Info</div>
                <div class="counselling-benefit-desc">Get complete information on fees, payment plans and scholarships.</div>
              </div>
            </div>

            <div class="counselling-benefit-item">
              <div class="counselling-benefit-icon">
                <i data-lucide="help-circle"></i>
              </div>
              <div class="counselling-benefit-text">
                <div class="counselling-benefit-heading">All Your Doubts Cleared</div>
                <div class="counselling-benefit-desc">A dedicated session to answer all your questions.</div>
              </div>
            </div>
          </div>

          <!-- Phone Card Helper -->
          <div class="counselling-helper-card phone-card">
            <div class="counselling-helper-icon">
              <i data-lucide="headset"></i>
            </div>
            <div class="counselling-helper-info">
              <div class="helper-title">Need immediate help?</div>
              <div class="helper-desc">Call us directly at</div>
              <div class="helper-highlight">+91 8692 009 002</div>
            </div>
          </div>

          <!-- Free Card Helper -->
          <div class="counselling-helper-card free-card">
            <div class="counselling-helper-icon">
              <i data-lucide="shield-check"></i>
            </div>
            <div class="counselling-helper-info">
              <div class="helper-title">100% Free. 100% Worth It.</div>
              <div class="helper-desc">
                There's no fee for the counselling session. It's completely free and commitment-free.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Footer Bar -->
      <div class="counselling-modal-footer">
        <div class="counselling-footer-item">
          <i data-lucide="check-circle-2"></i>
          <span class="counselling-footer-text">Trusted by Thousands</span>
        </div>
        <div class="counselling-footer-divider"></div>
        <div class="counselling-footer-item">
          <i data-lucide="graduation-cap"></i>
          <span class="counselling-footer-text">Expert Faculty Guidance</span>
        </div>
        <div class="counselling-footer-divider"></div>
        <div class="counselling-footer-item">
          <i data-lucide="award"></i>
          <span class="counselling-footer-text">Proven Results & Success Stories</span>
        </div>
        <div class="counselling-footer-divider"></div>
        <div class="counselling-footer-item">
          <i data-lucide="globe"></i>
          <span class="counselling-footer-text">Global Qualification, Unlimited Opportunities</span>
        </div>
      </div>

    </div>
  </div>
  `;

  // 3. Inject HTML Modal into the page DOM
  document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.createElement('div');
    wrapper.id = 'counsellingModalWrapper';
    wrapper.innerHTML = modalHTML;
    document.body.appendChild(wrapper);

    // Initialize lucide icons for newly appended DOM elements
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    const backdrop = document.getElementById('counsellingModalBackdrop');
    const closeBtn = document.getElementById('counsellingModalClose');
    const form = document.getElementById('counsellingForm');

    // Open Modal function
    function openModal() {
      // Calculate scrollbar width to prevent page shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden'; // Disable page scrolling
      clearErrors();
    }

    // Close Modal function
    function closeModal() {
      backdrop.classList.remove('active');
      document.body.style.overflow = ''; // Enable page scrolling
      document.body.style.paddingRight = ''; // Remove padding shift compensation
      form.reset();
      clearErrors();
      
      // Reset custom selects placeholders
      document.querySelectorAll('.counselling-custom-select').forEach(customSelect => {
        const select = customSelect.previousSibling;
        const placeholderOption = select.querySelector('option[disabled]');
        const textSpan = customSelect.querySelector('.counselling-select-trigger span');
        textSpan.textContent = placeholderOption ? placeholderOption.textContent : 'Select option';
        textSpan.classList.add('placeholder');
        customSelect.querySelectorAll('.counselling-select-option').forEach(opt => opt.classList.remove('selected'));
      });

      // Reset custom date picker placeholder
      const dateWrapper = document.querySelector('.counselling-custom-date');
      if (dateWrapper) {
        dateWrapper.dispatchEvent(new CustomEvent('resetDatePicker'));
      }
    }

    // Event listeners for close triggers
    closeBtn.addEventListener('click', closeModal);

    // Custom Dropdown Builder
    function initCustomDropdowns() {
      const selects = form.querySelectorAll('select');
      selects.forEach(select => {
        const wrapper = document.createElement('div');
        wrapper.className = 'counselling-custom-select';
        
        const trigger = document.createElement('div');
        trigger.className = 'counselling-select-trigger';
        
        const selectedSpan = document.createElement('span');
        selectedSpan.className = 'placeholder';
        const placeholderOption = select.querySelector('option[disabled][selected]');
        selectedSpan.textContent = placeholderOption ? placeholderOption.textContent : select.options[0].textContent;
        
        const chevron = document.createElement('i');
        chevron.setAttribute('data-lucide', 'chevron-down');
        
        trigger.appendChild(selectedSpan);
        trigger.appendChild(chevron);
        
        const dropdown = document.createElement('div');
        dropdown.className = 'counselling-select-dropdown';
        
        Array.from(select.options).forEach(option => {
          if (option.disabled) return; // Skip placeholder
          
          const optDiv = document.createElement('div');
          optDiv.className = 'counselling-select-option';
          optDiv.textContent = option.textContent;
          optDiv.setAttribute('data-value', option.value);
          
          optDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            select.value = option.value;
            selectedSpan.textContent = option.textContent;
            selectedSpan.classList.remove('placeholder');
            
            dropdown.querySelectorAll('.counselling-select-option').forEach(el => el.classList.remove('selected'));
            optDiv.classList.add('selected');
            
            // Fire change event
            const event = new Event('change', { bubbles: true });
            select.dispatchEvent(event);
            
            // Clear validation error on selection
            const group = select.closest('.counselling-form-group');
            if (group) {
              group.classList.remove('has-error');
              const errorLabel = group.querySelector('.counselling-validation-error');
              if (errorLabel) errorLabel.remove();
            }
            
            wrapper.classList.remove('active');
          });
          
          dropdown.appendChild(optDiv);
        });
        
        wrapper.appendChild(trigger);
        wrapper.appendChild(dropdown);
        
        // Hide standard select
        select.style.display = 'none';
        select.parentNode.insertBefore(wrapper, select.nextSibling);
        
        // Open/Close toggle
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          document.querySelectorAll('.counselling-custom-select').forEach(el => {
            if (el !== wrapper) el.classList.remove('active');
          });
          wrapper.classList.toggle('active');
        });
      });
      
      // Close dropdowns on clicking outside
      document.addEventListener('click', () => {
        document.querySelectorAll('.counselling-custom-select').forEach(el => el.classList.remove('active'));
      });
    }

    // Initialize custom dropdowns
    initCustomDropdowns();

    // Custom Date Picker Builder
    function initCustomDatePicker() {
      const dateInput = document.getElementById('counsellingDate');
      if (!dateInput) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'counselling-custom-date';

      const trigger = document.createElement('div');
      trigger.className = 'counselling-date-trigger';

      const selectedSpan = document.createElement('span');
      selectedSpan.className = 'placeholder';
      selectedSpan.textContent = 'Select a date';

      const calIcon = document.createElement('i');
      calIcon.setAttribute('data-lucide', 'calendar');

      trigger.appendChild(selectedSpan);
      trigger.appendChild(calIcon);

      const popup = document.createElement('div');
      popup.className = 'counselling-calendar-popup';

      wrapper.appendChild(trigger);
      wrapper.appendChild(popup);

      // Hide original date input
      dateInput.style.display = 'none';
      dateInput.parentNode.insertBefore(wrapper, dateInput.nextSibling);

      let currentDate = new Date();
      let selectedDate = null;

      function renderCalendar(year, month) {
        popup.innerHTML = '';

        // Header block
        const header = document.createElement('div');
        header.className = 'counselling-calendar-header';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.innerHTML = '<i data-lucide="chevron-left"></i>';
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentDate.setMonth(currentDate.getMonth() - 1);
          renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        const titleSpan = document.createElement('span');
        titleSpan.className = 'calendar-month-year';
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        titleSpan.textContent = `${months[month]} ${year}`;

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.innerHTML = '<i data-lucide="chevron-right"></i>';
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentDate.setMonth(currentDate.getMonth() + 1);
          renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });

        header.appendChild(prevBtn);
        header.appendChild(titleSpan);
        header.appendChild(nextBtn);
        popup.appendChild(header);

        // Weekdays block
        const weekdays = document.createElement('div');
        weekdays.className = 'counselling-calendar-weekdays';
        ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => {
          const dayDiv = document.createElement('div');
          dayDiv.textContent = day;
          weekdays.appendChild(dayDiv);
        });
        popup.appendChild(weekdays);

        // Days block
        const daysGrid = document.createElement('div');
        daysGrid.className = 'counselling-calendar-days';

        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0,0,0,0);

        // Empty cells padding
        for (let i = 0; i < firstDay; i++) {
          const emptyCell = document.createElement('div');
          emptyCell.className = 'empty';
          daysGrid.appendChild(emptyCell);
        }

        // Render days
        for (let d = 1; d <= totalDays; d++) {
          const dayCell = document.createElement('div');
          dayCell.textContent = d;

          const cellDate = new Date(year, month, d);
          cellDate.setHours(0,0,0,0);

          // Disable past days
          if (cellDate < today) {
            dayCell.className = 'disabled';
          } else {
            if (selectedDate && cellDate.getTime() === selectedDate.getTime()) {
              dayCell.classList.add('selected');
            }

            dayCell.addEventListener('click', (e) => {
              e.stopPropagation();
              selectedDate = cellDate;
              
              const yyyy = year;
              const mm = String(month + 1).padStart(2, '0');
              const dd = String(d).padStart(2, '0');
              dateInput.value = `${yyyy}-${mm}-${dd}`;

              selectedSpan.textContent = `${d} ${months[month].substring(0, 3)} ${year}`;
              selectedSpan.classList.remove('placeholder');

              const group = dateInput.closest('.counselling-form-group');
              if (group) {
                group.classList.remove('has-error');
                const err = group.querySelector('.counselling-validation-error');
                if (err) err.remove();
              }

              wrapper.classList.remove('active');
            });
          }

          daysGrid.appendChild(dayCell);
        }

        popup.appendChild(daysGrid);

        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }

      // Toggle Active Calendar
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.counselling-custom-select').forEach(el => el.classList.remove('active'));
        
        const isActive = wrapper.classList.contains('active');
        if (!isActive) {
          currentDate = selectedDate ? new Date(selectedDate) : new Date();
          renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        }
        wrapper.classList.toggle('active');
      });

      // Close calendar popup on click outside
      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
          wrapper.classList.remove('active');
        }
      });

      // Expose reset trigger helper
      wrapper.addEventListener('resetDatePicker', () => {
        selectedDate = null;
        selectedSpan.textContent = 'Select a date';
        selectedSpan.classList.add('placeholder');
      });
    }

    // Initialize custom date picker
    initCustomDatePicker();

    // Custom Validation
    function clearErrors() {
      form.querySelectorAll('.counselling-form-group').forEach(group => {
        group.classList.remove('has-error');
        const err = group.querySelector('.counselling-validation-error');
        if (err) err.remove();
      });
    }

    function showError(inputEl, message) {
      const group = inputEl.closest('.counselling-form-group');
      if (!group) return;
      
      group.classList.add('has-error');
      
      let errorLabel = group.querySelector('.counselling-validation-error');
      if (!errorLabel) {
        errorLabel = document.createElement('div');
        errorLabel.className = 'counselling-validation-error';
        group.appendChild(errorLabel);
      }
      
      errorLabel.innerHTML = `<i data-lucide="alert-circle" style="width: 12px; height: 12px; display: inline-block;"></i> ${message}`;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }

    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    function validatePhone(phone) {
      const digits = phone.replace(/\D/g, '');
      return digits.length === 10;
    }

    // Handle Form Submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors();
      
      let isValid = true;
      
      // Check Email
      const emailInput = document.getElementById('counsellingEmail');
      if (!validateEmail(emailInput.value.trim())) {
        showError(emailInput, 'Please enter a valid email address.');
        isValid = false;
      }
      
      // Check Phone
      const phoneInput = document.getElementById('counsellingPhone');
      if (!validatePhone(phoneInput.value.trim())) {
        showError(phoneInput, 'Please enter a valid 10-digit phone number.');
        isValid = false;
      }

      // Check Date
      const dateInput = document.getElementById('counsellingDate');
      if (!dateInput.value) {
        const customWrapper = dateInput.nextSibling;
        showError(customWrapper, 'Please select a preferred date.');
        isValid = false;
      }

      // Check standard select validation (required check since they are hidden)
      const selects = form.querySelectorAll('select[required]');
      selects.forEach(select => {
        if (!select.value) {
          const customWrapper = select.nextSibling;
          showError(customWrapper, 'Please select an option.');
          isValid = false;
        }
      });
      
      if (!isValid) {
        return; // Stop submission if invalid
      }

      // Simple mock successful submission visual feedback
      const submitBtn = form.querySelector('.counselling-submit-btn');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.disabled = true;
      submitBtn.style.backgroundColor = '#2e7d32'; // Green success color
      submitBtn.innerHTML = '<i data-lucide="check-circle-2"></i> SESSION BOOKED!';
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons({
          attrs: {
            class: 'btn-icon'
          }
        });
      }

      setTimeout(() => {
        alert('Your counselling session has been successfully requested! Our experts will call you soon.');
        closeModal();
        form.reset();
        
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.style.backgroundColor = '';
        submitBtn.innerHTML = originalText;
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 1000);
    });

    // Use event delegation on document body to capture clicks on dynamic buttons
    document.body.addEventListener('click', (e) => {
      const target = e.target.closest('a, button');
      if (!target) return;

      const isCtaButton = target.classList.contains('why-acca-cta-btn') || target.classList.contains('btn-presence-cta');
      const textMatches = target.textContent.trim().toLowerCase().includes('book counselling') || 
                          target.textContent.trim().toLowerCase().includes('free counselling');

      if (isCtaButton || textMatches || target.getAttribute('href') === '#book-counselling') {
        e.preventDefault();
        openModal();
      }
    });
  });
})();
