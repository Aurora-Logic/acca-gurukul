import { subDays, format } from 'date-fns';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isoDate(date: Date): string {
    return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
}

function generateTrend(days: number, { min = 0, max = 10 } = {}): { date: string; count: number }[] {
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
        const date = subDays(today, days - 1 - i);
        return {
            date: format(date, 'yyyy-MM-dd'),
            count: Math.floor(Math.random() * (max - min + 1)) + min,
        };
    });
}

const now = new Date();

// ---------------------------------------------------------------------------
// 1. Auth
// ---------------------------------------------------------------------------

export const auth = {
    user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@irus.in',
        role: 'super_admin',
    },
};

// ---------------------------------------------------------------------------
// 8. Services (referenced by appointments)
// ---------------------------------------------------------------------------

export const servicesData = [
    { id: 1, title: 'Robotic Prostatectomy' },
    { id: 2, title: 'Kidney Cancer Surgery' },
    { id: 3, title: 'Bladder Cancer Treatment' },
    { id: 4, title: 'General Consultation' },
];

// ---------------------------------------------------------------------------
// 3. Appointments
// ---------------------------------------------------------------------------

export const appointmentStatuses = ['new', 'contacted', 'scheduled', 'completed', 'cancelled'] as const;

const appointmentsList = [
    { id: 1,  patient_name: 'Rajesh Kumar',       email: 'rajesh.kumar@gmail.com',       phone: '+91 98765 43210', preferred_date: isoDate(subDays(now, 1)),  preferred_time: '10:00 AM', status: 'new',       notes: null,                                          message: 'I would like to consult regarding prostate issues.',                  service_name: 'General Consultation',     created_at: isoDate(subDays(now, 2)),  updated_at: isoDate(subDays(now, 2))  },
    { id: 2,  patient_name: 'Anita Sharma',        email: 'anita.sharma@yahoo.com',       phone: '+91 87654 32109', preferred_date: isoDate(subDays(now, 0)),  preferred_time: '11:30 AM', status: 'contacted', notes: 'Called patient, scheduled follow-up.',         message: 'Need a second opinion on kidney diagnosis.',                          service_name: 'Kidney Cancer Surgery',    created_at: isoDate(subDays(now, 3)),  updated_at: isoDate(subDays(now, 1))  },
    { id: 3,  patient_name: 'Vikram Patel',        email: 'vikram.patel@outlook.com',     phone: '+91 99887 76655', preferred_date: isoDate(subDays(now, 3)),  preferred_time: '02:00 PM', status: 'scheduled', notes: 'Surgery scheduled for next week.',             message: 'Referred by Dr. Mehta for robotic surgery consultation.',             service_name: 'Robotic Prostatectomy',    created_at: isoDate(subDays(now, 5)),  updated_at: isoDate(subDays(now, 1))  },
    { id: 4,  patient_name: 'Priya Desai',         email: 'priya.desai@gmail.com',        phone: '+91 77665 54433', preferred_date: isoDate(subDays(now, 7)),  preferred_time: '09:30 AM', status: 'completed', notes: 'Post-op follow-up done. Recovery on track.',  message: 'Follow-up appointment after bladder treatment.',                      service_name: 'Bladder Cancer Treatment', created_at: isoDate(subDays(now, 10)), updated_at: isoDate(subDays(now, 7))  },
    { id: 5,  patient_name: 'Suresh Reddy',        email: 'suresh.reddy@hotmail.com',     phone: '+91 88776 65544', preferred_date: isoDate(subDays(now, 2)),  preferred_time: '03:00 PM', status: 'cancelled', notes: 'Patient cancelled due to travel.',            message: 'Want to discuss treatment options for kidney cancer.',                service_name: 'Kidney Cancer Surgery',    created_at: isoDate(subDays(now, 4)),  updated_at: isoDate(subDays(now, 2))  },
    { id: 6,  patient_name: 'Meena Iyer',          email: 'meena.iyer@gmail.com',         phone: '+91 99001 12233', preferred_date: isoDate(subDays(now, 0)),  preferred_time: '10:30 AM', status: 'new',       notes: null,                                          message: 'Experiencing urinary difficulties, seeking consultation.',            service_name: 'General Consultation',     created_at: isoDate(subDays(now, 1)),  updated_at: isoDate(subDays(now, 1))  },
    { id: 7,  patient_name: 'Arun Nair',           email: 'arun.nair@gmail.com',          phone: '+91 70098 87766', preferred_date: isoDate(subDays(now, 5)),  preferred_time: '04:00 PM', status: 'scheduled', notes: 'Pre-operative assessment completed.',          message: 'Diagnosed with prostate cancer, interested in robotic surgery.',      service_name: 'Robotic Prostatectomy',    created_at: isoDate(subDays(now, 8)),  updated_at: isoDate(subDays(now, 3))  },
    { id: 8,  patient_name: 'Kavita Joshi',        email: 'kavita.joshi@yahoo.com',       phone: '+91 81234 56789', preferred_date: isoDate(subDays(now, 4)),  preferred_time: '11:00 AM', status: 'completed', notes: 'Treatment completed successfully.',            message: 'Follow-up visit for bladder cancer treatment.',                      service_name: 'Bladder Cancer Treatment', created_at: isoDate(subDays(now, 12)), updated_at: isoDate(subDays(now, 4))  },
    { id: 9,  patient_name: 'Deepak Gupta',        email: 'deepak.gupta@gmail.com',       phone: '+91 92345 67890', preferred_date: isoDate(subDays(now, 1)),  preferred_time: '01:00 PM', status: 'contacted', notes: 'Awaiting lab results before scheduling.',      message: 'Kidney biopsy results pending, need expert review.',                 service_name: 'Kidney Cancer Surgery',    created_at: isoDate(subDays(now, 3)),  updated_at: isoDate(subDays(now, 1))  },
    { id: 10, patient_name: 'Sunita Menon',        email: 'sunita.menon@outlook.com',     phone: '+91 83456 78901', preferred_date: isoDate(subDays(now, 6)),  preferred_time: '09:00 AM', status: 'new',       notes: null,                                          message: 'General urology check-up required.',                                 service_name: 'General Consultation',     created_at: isoDate(subDays(now, 6)),  updated_at: isoDate(subDays(now, 6))  },
    { id: 11, patient_name: 'Ramesh Thakur',       email: 'ramesh.thakur@gmail.com',      phone: '+91 74567 89012', preferred_date: isoDate(subDays(now, 8)),  preferred_time: '02:30 PM', status: 'completed', notes: 'Discharged. Next follow-up in 3 months.',      message: 'Post-surgery review after robotic prostatectomy.',                    service_name: 'Robotic Prostatectomy',    created_at: isoDate(subDays(now, 15)), updated_at: isoDate(subDays(now, 8))  },
    { id: 12, patient_name: 'Lakshmi Narayan',     email: 'lakshmi.n@gmail.com',          phone: '+91 65678 90123', preferred_date: isoDate(subDays(now, 2)),  preferred_time: '03:30 PM', status: 'new',       notes: null,                                          message: 'My father has been diagnosed with bladder cancer. Need consultation.',service_name: 'Bladder Cancer Treatment', created_at: isoDate(subDays(now, 2)),  updated_at: isoDate(subDays(now, 2))  },
    { id: 13, patient_name: 'Mohit Saxena',        email: 'mohit.saxena@hotmail.com',     phone: '+91 56789 01234', preferred_date: isoDate(subDays(now, 9)),  preferred_time: '10:00 AM', status: 'cancelled', notes: 'Patient opted for treatment at another facility.', message: 'Looking for kidney cancer treatment options.',                     service_name: 'Kidney Cancer Surgery',    created_at: isoDate(subDays(now, 14)), updated_at: isoDate(subDays(now, 9))  },
    { id: 14, patient_name: 'Geeta Bhat',          email: 'geeta.bhat@gmail.com',         phone: '+91 90123 45678', preferred_date: isoDate(subDays(now, 0)),  preferred_time: '12:00 PM', status: 'scheduled', notes: 'Consultation booked for tomorrow.',            message: 'Referred by my family doctor for prostate check-up.',                service_name: 'General Consultation',     created_at: isoDate(subDays(now, 1)),  updated_at: isoDate(subDays(now, 0))  },
    { id: 15, patient_name: 'Sanjay Kulkarni',     email: 'sanjay.kulkarni@yahoo.com',    phone: '+91 81234 56700', preferred_date: isoDate(subDays(now, 3)),  preferred_time: '04:30 PM', status: 'contacted', notes: 'Shared pre-surgery requirements via email.',   message: 'Interested in minimally invasive surgery for kidney tumour.',         service_name: 'Kidney Cancer Surgery',    created_at: isoDate(subDays(now, 5)),  updated_at: isoDate(subDays(now, 3))  },
];

export const appointmentsData = {
    data: appointmentsList,
    current_page: 1,
    last_page: 2,
    from: 1,
    to: 15,
    total: 25,
    prev_page_url: null,
    next_page_url: '#',
    links: [
        { url: null,  label: '&laquo; Previous', active: false },
        { url: '#',   label: '1',                active: true  },
        { url: '#',   label: '2',                active: false },
        { url: '#',   label: 'Next &raquo;',     active: false },
    ],
};

// ---------------------------------------------------------------------------
// 2. Dashboard
// ---------------------------------------------------------------------------

export const dashboardData = {
    stats: {
        total_appointments: 25,
        new_appointments: 4,
        unread_contacts: 3,
        total_contacts: 8,
        total_posts: 10,
        published_posts: 7,
        total_blog_views: 4820,
    },
    recentAppointments: appointmentsList.slice(0, 5),
    appointmentsByStatus: {
        new: 4,
        contacted: 3,
        scheduled: 3,
        completed: 3,
        cancelled: 2,
    },
    appointmentsTrend: generateTrend(30, { min: 0, max: 5 }),
    contactsTrend: generateTrend(30, { min: 0, max: 3 }),
    blogViewsTrend: generateTrend(30, { min: 20, max: 120 }),
    topPosts: [
        { id: 1, title: 'Understanding Robotic Prostatectomy: A Comprehensive Guide',          views: 1245 },
        { id: 2, title: 'Kidney Cancer: Early Signs and When to See a Urologist',              views: 987  },
        { id: 3, title: 'Advances in Bladder Cancer Treatment in 2026',                        views: 843  },
        { id: 4, title: 'What to Expect Before and After Robotic Surgery',                     views: 712  },
        { id: 5, title: 'Minimally Invasive Urology: Benefits and Recovery',                   views: 633  },
    ],
};

// ---------------------------------------------------------------------------
// 4. Blog Posts
// ---------------------------------------------------------------------------

const blogPostsList = [
    {
        id: 1,
        title: 'Understanding Robotic Prostatectomy: A Comprehensive Guide',
        slug: 'understanding-robotic-prostatectomy',
        excerpt: 'Robotic prostatectomy has revolutionised the treatment of prostate cancer, offering patients less pain, shorter hospital stays, and faster recovery.',
        content: '<h2>What is Robotic Prostatectomy?</h2><p>Robotic prostatectomy is a minimally invasive surgical procedure used to remove the prostate gland in patients diagnosed with prostate cancer. Using the da Vinci surgical system, the surgeon operates through tiny incisions with enhanced precision, flexibility, and control.</p><h2>Benefits</h2><ul><li>Less blood loss during surgery</li><li>Shorter hospital stay (typically 1-2 days)</li><li>Faster recovery and return to normal activities</li><li>Reduced post-operative pain</li><li>Better preservation of urinary and sexual function</li></ul><p>At iRUS, our team has performed over 500 robotic prostatectomies with excellent outcomes.</p>',
        category: 'Robotic Surgery',
        tags: ['prostate cancer', 'robotic surgery', 'minimally invasive'],
        featured_image: null,
        is_published: true,
        published_at: isoDate(subDays(now, 5)),
        meta_title: 'Robotic Prostatectomy Guide | iRUS Urology',
        meta_description: 'Learn about robotic prostatectomy, its benefits, procedure details, and recovery at iRUS Institute of Robotic Urology.',
        views: 1245,
        created_at: isoDate(subDays(now, 10)),
        updated_at: isoDate(subDays(now, 5)),
    },
    {
        id: 2,
        title: 'Kidney Cancer: Early Signs and When to See a Urologist',
        slug: 'kidney-cancer-early-signs',
        excerpt: 'Recognising the early warning signs of kidney cancer can significantly improve treatment outcomes. Here is what you need to know.',
        content: '<h2>Early Warning Signs</h2><p>Kidney cancer often shows no symptoms in its early stages, which is why regular health check-ups are crucial. However, some signs to watch for include:</p><ul><li>Blood in the urine (haematuria)</li><li>Persistent pain in the lower back or side</li><li>A lump or mass in the kidney area</li><li>Unexplained weight loss</li><li>Fatigue and intermittent fever</li></ul><h2>When to See a Specialist</h2><p>If you experience any of these symptoms persistently, consult a urologist immediately. Early detection can make a significant difference in treatment success rates.</p>',
        category: 'Kidney Cancer',
        tags: ['kidney cancer', 'early detection', 'urology'],
        featured_image: null,
        is_published: true,
        published_at: isoDate(subDays(now, 8)),
        meta_title: 'Kidney Cancer Early Signs | iRUS',
        meta_description: 'Identify the early symptoms of kidney cancer and know when to consult a urologist for timely diagnosis and treatment.',
        views: 987,
        created_at: isoDate(subDays(now, 12)),
        updated_at: isoDate(subDays(now, 8)),
    },
    {
        id: 3,
        title: 'Advances in Bladder Cancer Treatment in 2026',
        slug: 'bladder-cancer-treatment-advances-2026',
        excerpt: 'New therapies and surgical techniques are transforming the way bladder cancer is treated, improving patient outcomes and quality of life.',
        content: '<h2>Immunotherapy Breakthroughs</h2><p>Immunotherapy has emerged as a game-changer in bladder cancer treatment. Checkpoint inhibitors are now being used both as first-line treatments and in combination with chemotherapy for advanced cases.</p><h2>Robotic Cystectomy</h2><p>Robotic-assisted radical cystectomy offers patients a minimally invasive alternative to traditional open surgery, with comparable oncological outcomes and faster recovery times.</p><h2>Personalised Medicine</h2><p>Genomic profiling is allowing clinicians to tailor treatment plans based on the molecular characteristics of each patient\'s tumour, leading to more effective and targeted therapies.</p>',
        category: 'Bladder Cancer',
        tags: ['bladder cancer', 'immunotherapy', 'robotic surgery'],
        featured_image: null,
        is_published: true,
        published_at: isoDate(subDays(now, 12)),
        meta_title: 'Bladder Cancer Treatment 2026 | iRUS',
        meta_description: 'Explore the latest advances in bladder cancer treatment including immunotherapy, robotic surgery, and personalised medicine.',
        views: 843,
        created_at: isoDate(subDays(now, 15)),
        updated_at: isoDate(subDays(now, 12)),
    },
    {
        id: 4,
        title: 'What to Expect Before and After Robotic Surgery',
        slug: 'what-to-expect-robotic-surgery',
        excerpt: 'A step-by-step guide to preparing for robotic urological surgery and understanding the recovery process.',
        content: '<h2>Before Surgery</h2><p>Your surgical team will guide you through pre-operative assessments including blood tests, imaging, and anaesthesia evaluation. You will be advised to:</p><ul><li>Stop certain medications as directed</li><li>Fast for at least 8 hours before surgery</li><li>Arrange for someone to drive you home after discharge</li></ul><h2>After Surgery</h2><p>Most patients are discharged within 1-2 days. You can expect mild discomfort at the incision sites, which is managed with oral pain medication. Full recovery typically takes 4-6 weeks, during which you should avoid heavy lifting and strenuous activity.</p>',
        category: 'Robotic Surgery',
        tags: ['robotic surgery', 'patient guide', 'recovery'],
        featured_image: null,
        is_published: true,
        published_at: isoDate(subDays(now, 15)),
        meta_title: 'Robotic Surgery Preparation & Recovery | iRUS',
        meta_description: 'Complete patient guide for preparing for and recovering from robotic urological surgery at iRUS.',
        views: 712,
        created_at: isoDate(subDays(now, 18)),
        updated_at: isoDate(subDays(now, 15)),
    },
    {
        id: 5,
        title: 'Minimally Invasive Urology: Benefits and Recovery',
        slug: 'minimally-invasive-urology-benefits',
        excerpt: 'Why minimally invasive techniques are becoming the gold standard in urological surgery and what it means for patients.',
        content: '<h2>Why Minimally Invasive?</h2><p>Minimally invasive procedures use small incisions and specialised instruments, including robotic systems, to perform complex surgeries with greater precision. Benefits include reduced scarring, less pain, and quicker return to daily activities.</p><h2>Common Procedures</h2><ul><li>Robotic prostatectomy</li><li>Laparoscopic nephrectomy</li><li>Robotic cystectomy</li><li>Ureteral reimplantation</li></ul><p>Our centre specialises in these advanced techniques, providing patients with world-class care right here in India.</p>',
        category: 'General Urology',
        tags: ['minimally invasive', 'laparoscopy', 'urology'],
        featured_image: null,
        is_published: true,
        published_at: isoDate(subDays(now, 20)),
        meta_title: 'Minimally Invasive Urology | iRUS',
        meta_description: 'Discover the benefits of minimally invasive urological procedures and how they lead to faster recovery.',
        views: 633,
        created_at: isoDate(subDays(now, 22)),
        updated_at: isoDate(subDays(now, 20)),
    },
    {
        id: 6,
        title: 'Living with a Urostomy: A Patient Guide',
        slug: 'living-with-urostomy-patient-guide',
        excerpt: 'Practical tips and emotional support for patients adapting to life with a urostomy after bladder surgery.',
        content: '<h2>Understanding Your Urostomy</h2><p>A urostomy is a surgically created opening that allows urine to drain from the body when the bladder has been removed or bypassed. Adapting to a urostomy takes time, but with proper care and support, patients can lead full, active lives.</p><h2>Daily Care Tips</h2><ul><li>Empty your pouch regularly throughout the day</li><li>Clean the stoma area gently during pouch changes</li><li>Stay hydrated to maintain healthy urine output</li><li>Watch for signs of skin irritation around the stoma</li></ul>',
        category: 'Patient Care',
        tags: ['urostomy', 'patient care', 'bladder cancer'],
        featured_image: null,
        is_published: true,
        published_at: isoDate(subDays(now, 25)),
        meta_title: 'Urostomy Patient Guide | iRUS',
        meta_description: 'Practical advice for living with a urostomy, including daily care tips and emotional support resources.',
        views: 421,
        created_at: isoDate(subDays(now, 28)),
        updated_at: isoDate(subDays(now, 25)),
    },
    {
        id: 7,
        title: 'PSA Testing: What Every Man Should Know',
        slug: 'psa-testing-what-men-should-know',
        excerpt: 'An overview of Prostate-Specific Antigen testing, when it is recommended, and how to interpret the results.',
        content: '<h2>What is PSA?</h2><p>Prostate-Specific Antigen (PSA) is a protein produced by the prostate gland. Elevated levels in the blood can indicate prostate cancer, but can also be caused by benign conditions such as an enlarged prostate or prostatitis.</p><h2>When to Get Tested</h2><p>Men over 50 should discuss PSA screening with their doctor. Those with a family history of prostate cancer or other risk factors may benefit from earlier screening starting at age 40-45.</p><h2>Interpreting Results</h2><p>A PSA level below 4 ng/mL is generally considered normal. However, PSA levels should be evaluated in context with other factors including age, prostate size, and rate of PSA change over time.</p>',
        category: 'Prostate Health',
        tags: ['PSA test', 'prostate cancer', 'screening'],
        featured_image: null,
        is_published: true,
        published_at: isoDate(subDays(now, 30)),
        meta_title: 'PSA Testing Guide | iRUS',
        meta_description: 'Everything you need to know about PSA testing for prostate cancer screening, including when to test and how to read results.',
        views: 389,
        created_at: isoDate(subDays(now, 35)),
        updated_at: isoDate(subDays(now, 30)),
    },
    {
        id: 8,
        title: 'Diet and Nutrition After Urological Surgery',
        slug: 'diet-nutrition-after-urological-surgery',
        excerpt: 'Nutritional guidance to support healing and recovery following urological procedures.',
        content: '<h2>Post-Surgery Nutrition</h2><p>Proper nutrition plays a vital role in recovery after surgery. A balanced diet rich in protein, vitamins, and minerals supports wound healing and immune function.</p><h2>Recommended Foods</h2><ul><li>Lean proteins: chicken, fish, eggs, lentils</li><li>Fruits and vegetables: berries, citrus, spinach, broccoli</li><li>Whole grains: brown rice, oats, whole wheat bread</li><li>Adequate fluids: water, clear soups, herbal teas</li></ul><h2>Foods to Avoid</h2><p>Limit spicy foods, caffeine, and alcohol in the early recovery period as they may irritate the urinary tract.</p>',
        category: 'Patient Care',
        tags: ['nutrition', 'recovery', 'post-surgery'],
        featured_image: null,
        is_published: false,
        published_at: null,
        meta_title: 'Post-Surgery Diet Guide | iRUS',
        meta_description: 'Dietary recommendations for recovery after urological surgery at iRUS.',
        views: 0,
        created_at: isoDate(subDays(now, 3)),
        updated_at: isoDate(subDays(now, 3)),
    },
    {
        id: 9,
        title: 'Robotic Surgery vs Traditional Open Surgery: A Comparison',
        slug: 'robotic-vs-open-surgery-comparison',
        excerpt: 'Comparing robotic-assisted surgery with conventional open surgery across key parameters including outcomes, recovery, and costs.',
        content: '<h2>Surgical Approach</h2><p>Traditional open surgery requires a large incision, while robotic surgery uses 5-6 small incisions (8-12 mm each). The robotic system provides 3D visualisation and wristed instruments that move with seven degrees of freedom.</p><h2>Outcomes Comparison</h2><table><tr><th>Parameter</th><th>Robotic</th><th>Open</th></tr><tr><td>Hospital Stay</td><td>1-2 days</td><td>5-7 days</td></tr><tr><td>Blood Loss</td><td>Minimal</td><td>Moderate to High</td></tr><tr><td>Recovery Time</td><td>2-4 weeks</td><td>6-8 weeks</td></tr><tr><td>Scarring</td><td>Minimal</td><td>Significant</td></tr></table>',
        category: 'Robotic Surgery',
        tags: ['robotic surgery', 'open surgery', 'comparison'],
        featured_image: null,
        is_published: false,
        published_at: null,
        meta_title: 'Robotic vs Open Surgery | iRUS',
        meta_description: 'Detailed comparison of robotic-assisted and traditional open urological surgery outcomes.',
        views: 0,
        created_at: isoDate(subDays(now, 1)),
        updated_at: isoDate(subDays(now, 1)),
    },
    {
        id: 10,
        title: 'Understanding Urinary Incontinence After Prostate Surgery',
        slug: 'urinary-incontinence-after-prostate-surgery',
        excerpt: 'A guide to understanding and managing urinary incontinence that may occur following prostate surgery.',
        content: '<h2>Why Does It Happen?</h2><p>Urinary incontinence after prostate surgery occurs because the sphincter muscles around the urethra may be temporarily weakened during the procedure. In most cases, continence improves significantly within 3-6 months.</p><h2>Recovery Strategies</h2><ul><li>Pelvic floor exercises (Kegel exercises) started before surgery</li><li>Gradual increase in physical activity</li><li>Bladder training techniques</li><li>Adequate fluid intake spread throughout the day</li></ul><p>Our physiotherapy team provides personalised rehabilitation programmes to help patients regain continence as quickly as possible.</p>',
        category: 'Prostate Health',
        tags: ['incontinence', 'prostate surgery', 'recovery'],
        featured_image: null,
        is_published: false,
        published_at: null,
        meta_title: 'Urinary Incontinence After Prostate Surgery | iRUS',
        meta_description: 'Learn about managing urinary incontinence after prostate surgery with exercises, training, and expert guidance.',
        views: 0,
        created_at: isoDate(subDays(now, 0)),
        updated_at: isoDate(subDays(now, 0)),
    },
];

export const blogPostsData = {
    data: blogPostsList,
    current_page: 1,
    last_page: 1,
    from: 1,
    to: 10,
    total: 10,
    prev_page_url: null,
    next_page_url: null,
    links: [
        { url: null, label: '&laquo; Previous', active: false },
        { url: '#',  label: '1',                active: true  },
        { url: null, label: 'Next &raquo;',     active: false },
    ],
};

// ---------------------------------------------------------------------------
// 5. Contacts
// ---------------------------------------------------------------------------

const contactsList = [
    { id: 1, name: 'Amit Verma',        email: 'amit.verma@gmail.com',        phone: '+91 98112 34567', subject: 'Appointment enquiry',                    message: 'I would like to book an appointment for a prostate check-up. Please let me know the available dates.',                          is_read: false, created_at: isoDate(subDays(now, 0))  },
    { id: 2, name: 'Pooja Mehta',        email: 'pooja.mehta@yahoo.com',       phone: '+91 87654 09876', subject: 'Insurance coverage question',            message: 'Does your hospital accept Mediclaim and Star Health insurance for robotic surgery procedures?',                                  is_read: true,  created_at: isoDate(subDays(now, 1))  },
    { id: 3, name: 'Ravi Shankar',       email: 'ravi.shankar@outlook.com',    phone: '+91 99876 54321', subject: 'Second opinion for kidney diagnosis',    message: 'My father has been diagnosed with a kidney tumour at another hospital. We would like a second opinion from your team.',           is_read: false, created_at: isoDate(subDays(now, 2))  },
    { id: 4, name: 'Neha Kapoor',        email: 'neha.kapoor@gmail.com',       phone: '+91 70012 34567', subject: 'Post-surgery follow-up',                 message: 'I had robotic prostatectomy at your hospital last month. I would like to schedule a follow-up visit.',                            is_read: true,  created_at: isoDate(subDays(now, 3))  },
    { id: 5, name: 'Kiran Rao',          email: 'kiran.rao@gmail.com',         phone: '+91 81234 99887', subject: 'International patient enquiry',           message: 'I am based in the UAE and would like to visit your hospital for treatment. Could you assist with the travel and stay arrangements?', is_read: false, created_at: isoDate(subDays(now, 5))  },
    { id: 6, name: 'Dr. Anil Prasad',    email: 'dr.anilprasad@hospital.org',  phone: '+91 99001 22334', subject: 'Referral for robotic surgery',           message: 'I am referring a patient with Stage II prostate cancer for robotic prostatectomy at your centre. Please share the admission process.', is_read: true, created_at: isoDate(subDays(now, 7))  },
    { id: 7, name: 'Fatima Shaikh',      email: 'fatima.shaikh@gmail.com',     phone: '+91 88776 11223', subject: 'Cost estimate for bladder surgery',      message: 'Could you provide an approximate cost for robotic cystectomy? My mother has been advised this procedure.',                        is_read: true,  created_at: isoDate(subDays(now, 10)) },
    { id: 8, name: 'Sudhir Choudhary',   email: 'sudhir.c@hotmail.com',        phone: '+91 77665 33221', subject: 'Request for medical records',            message: 'I was a patient at your hospital in January. I need copies of my medical records for insurance purposes.',                       is_read: true,  created_at: isoDate(subDays(now, 14)) },
];

export const contactsData = {
    data: contactsList,
    current_page: 1,
    last_page: 1,
    from: 1,
    to: 8,
    total: 8,
    prev_page_url: null,
    next_page_url: null,
    links: [
        { url: null, label: '&laquo; Previous', active: false },
        { url: '#',  label: '1',                active: true  },
        { url: null, label: 'Next &raquo;',     active: false },
    ],
};

// ---------------------------------------------------------------------------
// 6. Users
// ---------------------------------------------------------------------------

export const usersData = [
    { id: 1, name: 'Admin User',     email: 'admin@irus.in',        role: 'super_admin', is_active: true,  created_at: isoDate(subDays(now, 180)) },
    { id: 2, name: 'Dr. Priya Nair', email: 'priya.nair@irus.in',   role: 'admin',       is_active: true,  created_at: isoDate(subDays(now, 120)) },
    { id: 3, name: 'Rahul Menon',    email: 'rahul.menon@irus.in',  role: 'editor',      is_active: true,  created_at: isoDate(subDays(now, 90))  },
    { id: 4, name: 'Sneha Pillai',   email: 'sneha.pillai@irus.in', role: 'editor',      is_active: true,  created_at: isoDate(subDays(now, 60))  },
    { id: 5, name: 'Arjun Das',      email: 'arjun.das@irus.in',    role: 'admin',       is_active: false, created_at: isoDate(subDays(now, 45))  },
];

// ---------------------------------------------------------------------------
// 7. SEO
// ---------------------------------------------------------------------------

export const seoData = {
    seoSettings: [
        { 
            page_identifier: 'home',       
            meta_title: 'iRUS - Institute of Robotic Uro-Oncology and Surgery, Pune', 
            meta_description: 'We are the Institute of Robotic Uro-Oncology and Surgery. Leading robotic urology centre in Pune offering advanced surgical solutions.', 
            meta_keywords: 'iRUS, robotic surgery, uro-oncology, urology, pune, prostate cancer, kidney cancer, robotic urology',
            og_title: 'iRUS - Institute of Robotic Uro-Oncology and Surgery',
            og_description: 'Leading robotic urology centre in Pune offering advanced surgical solutions.',
            canonical_url: 'https://irus.co.in/home',
            noindex: false 
        },
        { 
            page_identifier: 'booking',    
            meta_title: 'Book an Appointment - iRUS',                                         
            meta_description: 'Schedule a consultation with our leading robotic urology experts.',       
            meta_keywords: 'book appointment, urologist consultation, online booking, irus schedule',
            canonical_url: 'https://irus.co.in/booking',
            noindex: false 
        },
        { 
            page_identifier: 'contact',    
            meta_title: 'Contact Us - iRUS Institute of Robotic Urology',                     
            meta_description: 'Get in touch with iRUS for appointments, enquiries, or referrals. We are here to help.',                                          
            meta_keywords: 'contact irus, urology clinic pune, hospital address, contact number',
            canonical_url: 'https://irus.co.in/contact',
            noindex: false 
        },
        { 
            page_identifier: 'news',       
            meta_title: 'News & Blog - iRUS',                                                 
            meta_description: 'Read the latest updates, medical news, and articles on urology and robotic surgery.',          
            noindex: false 
        },
        { 
            page_identifier: 'privacy',    
            meta_title: 'Privacy Policy - iRUS',                                              
            meta_description: 'Read the privacy policy of iRUS Institute of Robotic Urology.', 
            noindex: false 
        },
        { 
            page_identifier: 'terms',      
            meta_title: 'Terms of Service - iRUS',                                            
            meta_description: 'Terms of service and conditions for using iRUS website and services.', 
            noindex: false 
        },
        { 
            page_identifier: 'disclaimer', 
            meta_title: 'Disclaimer - iRUS',                                                  
            meta_description: 'Medical and website disclaimer for iRUS Institute of Robotic Urology.', 
            noindex: false 
        },
    ],
    pages: [
        { identifier: 'home',       label: 'Home',              icon: 'Globe' },
        { identifier: 'booking',    label: 'Book Appointment',  icon: 'Globe' },
        { identifier: 'contact',    label: 'Contact',           icon: 'Globe' },
        { identifier: 'news',       label: 'News / Blog',       icon: 'Globe' },
        { identifier: 'privacy',    label: 'Privacy Policy',    icon: 'Globe' },
        { identifier: 'terms',      label: 'Terms of Service',  icon: 'Globe' },
        { identifier: 'disclaimer', label: 'Disclaimer',        icon: 'Globe' },
    ],
    sitemapInfo: {
        last_generated: '2026-04-01T10:00:00Z',
    },
};
