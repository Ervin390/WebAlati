/**
 * script.js - WebAlati App Logic
 * Vanilla JS SPA handling and dynamic API data fetching
 */

// --- State ---
let allTools = [];
let allBlogs = [];
const API_URL = window.WEBALATI_TOOLS_API || "https://script.google.com/macros/s/AKfycbw7qXVMqy4MICLn77QjS-ie11AE4ITvd6oGwXiJXhvJLTHnkImtcRGsx9eaklLYYJBQ/exec";

// Pagination
let currentDisplayCount = 20;
const LOAD_MORE_STEP = 20;

// Internal data state to track changes
let lastDataFingerprint = "";

// --- Translation Dictionary (For JS injected content only) ---
const TRANSLATIONS = {
    en: {
        cat_design: "Design",
        cat_video: "Video",
        cat_productivity: "Productivity",
        cat_earnings: "Earnings",
        cat_fun: "Entertainment",
        free: "Free",
        freemium: "Freemium",
        paid: "Paid",
        try_tool: "Try Tool",
        details: "Click for more details",
        submitting: "Sending...",
        success_nl_title: "Thanks for joining! 🎉",
        success_nl_msg: "You have successfully subscribed! You will soon start receiving selected AI tools directly in your inbox.",
        success_cf_title: "Message received! ✅",
        success_cf_msg: "Your message has been received. We will contact you shortly.",
        error_try_again: "Error. Please try again.",
        error_name: "Please enter your full name.",
        error_email: "Please enter a valid email address.",
        error_message: "Please enter your message.",
        error_terms: "You must accept the terms and conditions.",
        subscribe_btn: "Subscribe!",
        send_btn: "Submit!",
        download_pdf_btn: "Download Free PDF",
        success_nl_title: "Success! 🎉"
    },
    hr: {
        cat_design: "Dizajn",
        cat_video: "Video",
        cat_productivity: "Produktivnost",
        cat_earnings: "Zarada",
        cat_fun: "Zabavno",
        free: "Besplatno",
        freemium: "Freemium",
        paid: "Plaćeno",
        try_tool: "Isprobaj Alat",
        details: "Klikni za više detalja",
        submitting: "Šaljem...",
        success_nl_title: "Hvala na prijavi! 🎉",
        success_nl_msg: "Uspješno ste se prijavili! Ubrzo ćete početi primati odabrane AI alate direktno u vaš inbox.",
        success_cf_title: "Poruka zaprimljena! ✅",
        success_cf_msg: "Vaša poruka je zaprimljena. Ubrzo ćemo vas kontaktirati.",
        error_try_again: "Greška. Pokušajte ponovo.",
        error_name: "Unesite vaše ime i prezime.",
        error_email: "Unesite ispravnu email adresu.",
        error_message: "Unesite poruku.",
        error_terms: "Morate prihvatiti pravila i uvjete korištenja.",
        subscribe_btn: "Pretplati me!",
        send_btn: "Pošalji Upit!",
        download_pdf_btn: "Preuzmi besplatni PDF",
        success_nl_title: "Uspješno! 🎉"
    }
};

let currentLang = window.WEBALATI_LANG || 'hr';

// Handle relative paths for assets based on directory depth
const pathParts = window.location.pathname.split('/').filter(p => p && !p.endsWith('.html'));
// Determine depth: /hr/ is depth 1, /hr/blogs/ is depth 2
let depth = pathParts.length;
// Special case: if we are at root but not in a subfolder (e.g. index.html)
if (window.location.pathname.includes('/hr/') || window.location.pathname.includes('/en/')) {
    // Already handled by pathParts filtering
} else {
    depth = 0;
}
const ASSET_PREFIX = '../'.repeat(depth);

const TOOL_DESCRIPTIONS_EN = {
    "ElevenLabs": "Forget robotic sound. With ElevenLabs create natural voice for video, business and content.",
    "Kling AI": "Advanced AI tool for generating video from text and images. Kling AI enables the creation of realistic and cinematic videos with simple prompts.",
    "EyeCandy": "Eyecandy – A visual encyclopedia for filmmakers and video creators. Explore a wide range of filming techniques and styles with real video examples."
};

const ALLOWED_SUBCATEGORIES = [
    "Workflow Automation & AI Agents",
    "UGC & Influencer Marketing",
    "AI Image Generation & Editing",
    "Text-to-Speech & Voice Cloning",
    "AI Assistant",
    "Online Learning & Courses",
    "Health & Fitness",
    "Social Media Video Content",
    "Video Repurposing & Short-Form",
    "AI Video Generation",
    "Social Media Management",
    "Remote Work & Freelancing",
    "Food & Cooking AI",
    "Website Builder & Platform",
    "Language Learning"
];

// --- DOM Elements ---
const homeView = document.getElementById('home-view');
const categoryView = document.getElementById('category-view');
const homeLink = document.getElementById('home-link');
const toolModal = document.getElementById('tool-modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');
const modalOverlay = document.getElementById('modal-overlay');
const navHomeBtn = document.getElementById('nav-home-btn');
const trendingContainer = document.getElementById('trending-container');
const categoryToolsContainer = document.getElementById('category-tools-container');
const categoryTitle = document.getElementById('category-title');
const categoryCards = document.querySelectorAll('.category-card');
const viewAllBtn = document.getElementById('view-all-btn');

// Filters
const searchInput = document.getElementById('search-input');
const filterCategory = document.getElementById('filter-category');
const filterSubcategory = document.getElementById('filter-subcategory');
const filterAccess = document.getElementById('filter-access');
const filterTag = document.getElementById('filter-tag');
const loadMoreBtn = document.getElementById('load-more-btn');
const loadMoreContainer = document.getElementById('load-more-container');

// Forms & new modals
const newsletterModal = document.getElementById('newsletter-modal');
const contactModal = document.getElementById('contact-modal');
const successModal = document.getElementById('success-modal');
const cookieBanner = document.getElementById('cookie-banner');
const acceptCookiesBtn = document.getElementById('accept-cookies');
const LANG = window.WEBALATI_LANG || 'hr';

// Default English APIs
const DEFAULT_EN_NEWSLETTER = 'https://script.google.com/macros/s/AKfycbw-6q8Q_LWaddm08JN9lLFKYBpUfiZaHXk0B9qpsq89nWR9TuYPqPKbYfmU-QGHL9PLJA/exec';
const DEFAULT_EN_CONTACT = 'https://script.google.com/macros/s/AKfycbzMMzXs14OEjkye5wjNPGIVH2vY6-aA1dvMc0diOfWc612I1SpgNPKNCi4_0yYyt_HN/exec';

// Default Croatian APIs
const DEFAULT_HR_NEWSLETTER = 'https://script.google.com/macros/s/AKfycbxn6-yeFxiFqrXgHLxBR-k0ky-2sUpk1hpw7t9bxNs_Avc240bQPl1g3iv6N2SPR4C_/exec';
const DEFAULT_HR_CONTACT = 'https://script.google.com/macros/s/AKfycbxfn3UB_8efNEB5zOJUBcjBDjrvYY9sJVK-6XgaOkg3_TsxXR-ROSYXScEC6d0_fllztg/exec';

const NEWSLETTER_API = window.WEBALATI_NEWSLETTER_API || (LANG === 'en' ? DEFAULT_EN_NEWSLETTER : DEFAULT_HR_NEWSLETTER);
const CONTACT_API = window.WEBALATI_CONTACT_API || (LANG === 'en' ? DEFAULT_EN_CONTACT : DEFAULT_HR_CONTACT);

// --- Security: Form API Token ---
// Set per language in each index.html / blog.html <head> script block:
//   window.WEBALATI_FORM_TOKEN  →  HR_FORM_TOKEN or EN_FORM_TOKEN
// NOTE: SIGNING_SECRET is only used by the GitHub Actions data pipeline, not forms.
const FORM_TOKEN = window.WEBALATI_FORM_TOKEN || '';

// --- Cookie Consent Logic ---
function loadGoogleAnalytics() {
    // Analytics is loaded via HTML tags; this serves as an internal hook if needed.
}
    /*
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
    ga('create', 'G-XXXXXXXXXX', 'auto');
    ga('set', 'anonymizeIp', true);
    ga('send', 'pageview');
    */

function checkCookieConsent() {
    if (!cookieBanner) return;
    const consent = localStorage.getItem('webalati_cookie_consent');
    if (consent === 'accepted') {
        cookieBanner.classList.add('hidden');
        loadGoogleAnalytics();
    } else {
        cookieBanner.classList.remove('hidden');
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initial Render trigger
        fetchToolsFromAPI();

        // Check for cookie consent
        checkCookieConsent();

        // Mobile Burger Menu
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navLinks = document.getElementById('nav-links');
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-xmark');
                } else {
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            });
            navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                });
            });
        }

        // Event Listeners
        if (homeLink) homeLink.addEventListener('click', showHome);
        if (navHomeBtn) navHomeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showHome();
        });

        // View All button
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                filterCategory.value = 'all';
                showCategory(currentLang === 'hr' ? 'Svi Alati' : 'All Tools');
                applyFilters();
            });
        }

        // Category Card clicks
        if (categoryCards) {
            categoryCards.forEach(card => {
                card.addEventListener('click', () => {
                    const categoryName = card.getAttribute('data-category').trim();

                    // Set the dropdown to match the clicked card
                    // We search for the best match in the dropdown options
                    let bestMatchValue = 'all';
                    const searchName = categoryName.toLowerCase();

                    Array.from(filterCategory.options).forEach(opt => {
                        const optValue = opt.value.toLowerCase();
                        if (optValue === searchName || searchName.includes(optValue) || optValue.includes(searchName)) {
                            bestMatchValue = opt.value;
                        }
                    });

                    resetOtherDropdowns('filter-category');
                    filterCategory.value = bestMatchValue;

                    // Re-sync UI
                    showCategory(bestMatchValue === 'all' ? 'Svi Alati' : bestMatchValue);
                    applyFilters();
                });
            });
        }

        // Filter Listeners
        const resetOtherDropdowns = (activeId) => {
            if (activeId !== 'filter-category' && filterCategory) filterCategory.value = 'all';
            if (activeId !== 'filter-subcategory' && filterSubcategory) filterSubcategory.value = 'all';
            if (activeId !== 'filter-access' && filterAccess) filterAccess.value = 'all';
            if (activeId !== 'filter-tag' && filterTag) filterTag.value = 'all';
        };

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (filterCategory) filterCategory.addEventListener('change', () => { resetOtherDropdowns('filter-category'); applyFilters(); });
        if (filterSubcategory) filterSubcategory.addEventListener('change', () => { resetOtherDropdowns('filter-subcategory'); applyFilters(); });
        if (filterAccess) filterAccess.addEventListener('change', () => { resetOtherDropdowns('filter-access'); applyFilters(); });
        if (filterTag) filterTag.addEventListener('change', () => { resetOtherDropdowns('filter-tag'); applyFilters(); });

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                currentDisplayCount += LOAD_MORE_STEP;
                applyFilters();
            });
        }

        // Tool Card Click Delegation (excluding the CTA button)
        document.addEventListener('click', (e) => {
            const toolCard = e.target.closest('.tool-card');
            const ctaBtn = e.target.closest('.btn-primary');

            if (toolCard && !ctaBtn && !toolCard.classList.contains('skeleton')) {
                const toolId = toolCard.getAttribute('data-id');
                openToolModal(toolId);
            }
        });

        if (closeModalBtn) closeModalBtn.addEventListener('click', closeToolModal);
        if (modalOverlay) modalOverlay.addEventListener('click', closeToolModal);

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeToolModal();
                if (newsletterModal) closeModal(newsletterModal);
                if (contactModal) closeModal(contactModal);
                if (successModal) closeModal(successModal);
            }
        });

        // ---- Newsletter modal ----
        const openNewsletterBtn = document.getElementById('open-newsletter-btn');
        const closeNewsletterModalBtn = document.getElementById('close-newsletter-modal');
        const newsletterModalOverlay = document.getElementById('newsletter-modal-overlay');
        const newsletterForm = document.getElementById('newsletter-form');

        if (openNewsletterBtn) openNewsletterBtn.addEventListener('click', () => openModal(newsletterModal));
        if (closeNewsletterModalBtn) closeNewsletterModalBtn.addEventListener('click', () => closeModal(newsletterModal));
        if (newsletterModalOverlay) newsletterModalOverlay.addEventListener('click', () => closeModal(newsletterModal));
        if (newsletterForm) newsletterForm.addEventListener('submit', handleNewsletterSubmit);

        // ---- Contact modal ----
        const openContactBtn = document.getElementById('open-contact-btn');
        const closeContactModalBtn = document.getElementById('close-contact-modal');
        const contactModalOverlay = document.getElementById('contact-modal-overlay');
        const contactForm = document.getElementById('contact-form');

        // New: Support multiple contact triggers via class
        const contactTriggers = document.querySelectorAll('.open-contact-link');

        if (openContactBtn) openContactBtn.addEventListener('click', () => openModal(contactModal));
        
        // Attach listener to all secondary contact links (e.g. in footer)
        contactTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(contactModal);
            });
        });

        if (closeContactModalBtn) closeContactModalBtn.addEventListener('click', () => closeModal(contactModal));
        if (contactModalOverlay) contactModalOverlay.addEventListener('click', () => closeModal(contactModal));
        if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

        // ---- Success modal ----
        const successModalOverlay = document.getElementById('success-modal-overlay');
        const successCloseBtn = document.getElementById('success-close-btn');

        if (successModalOverlay) successModalOverlay.addEventListener('click', () => closeModal(successModal));
        if (successCloseBtn) successCloseBtn.addEventListener('click', () => closeModal(successModal));

        // ---- Cookie Banner ----
        if (acceptCookiesBtn) {
            acceptCookiesBtn.addEventListener('click', () => {
                localStorage.setItem('webalati_cookie_consent', 'accepted');
                if (cookieBanner) cookieBanner.classList.add('hidden');
                loadGoogleAnalytics();
            });
        }

        // Smooth Scroll for Nav Links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    // If we are in Category View, go home first
                    if (categoryView && categoryView.classList.contains('active')) {
                        showHome();
                    }
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Setup Custom Language Switcher
        setupCustomLangSwitcher();
    } catch (err) {
        console.error('Init error:', err);
    }
});

/**
 * Custom Language Switcher Logic
 */
function setupCustomLangSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    const current = document.getElementById('lang-current');
    const list = document.getElementById('lang-list');
    if (!switcher || !current || !list) return;

    current.addEventListener('click', (e) => {
        e.stopPropagation();
        list.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        list.classList.remove('active');
    });

    list.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const url = opt.getAttribute('data-value');
            if (url) window.location.href = url;
        });
    });
}

// --- View Navigation ---
function showHome() {
    if (categoryView) categoryView.classList.remove('active');
    if (homeView) homeView.classList.add('active');
    window.scrollTo(0, 0);
}

function showCategory(categoryName) {
    if (homeView) homeView.classList.remove('active');
    if (categoryView) categoryView.classList.add('active');
    if (categoryTitle) categoryTitle.textContent = categoryName;
    window.scrollTo(0, 0);

    // Reset display count for fresh category view
    currentDisplayCount = 20;
}

// --- Clean Slug Generator ---
function createSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// --- SEO & Meta Update Function ---
function updateSEOForTool(tool) {
    document.title = `${tool.name} - AI Tool | WebAlati`;

    const setMeta = (name, content, attr = 'name') => {
        let tag = document.querySelector(`meta[${attr}="${name}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(attr, name);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    };

    const displayDesc = tool.desc ? tool.desc.substring(0, 155) + '...' : '';

    setMeta('description', displayDesc, 'name');
    
    let canonical = document.getElementById('canonical-url');
    if (canonical) {
        canonical.setAttribute('href', window.location.href);
    }

    setMeta('og:title', `${tool.name} - AI Tool | WebAlati`, 'property');
    setMeta('og:description', displayDesc, 'property');
    setMeta('og:image', tool.logo.startsWith('http') ? tool.logo : window.location.origin + '/' + tool.logo.replace(/^\.\.\//, ''), 'property');
    setMeta('og:url', window.location.href, 'property');

    let script = document.getElementById('seo-json-ld');
    if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('id', 'seo-json-ld');
        document.head.appendChild(script);
    }
    
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": tool.name,
        "operatingSystem": "Web Browser",
        "applicationCategory": tool.category || "BusinessApplication",
        "description": tool.desc,
        "url": window.location.href,
        "image": tool.logo.startsWith('http') ? tool.logo : window.location.origin + '/' + tool.logo.replace(/^\.\.\//, '')
    };
    script.textContent = JSON.stringify(jsonLd);
}

function resetSEO() {
    document.title = currentLang === 'hr' ? "WebAlati - Best AI and Web Tools" : "WebTools - Best AI and Web Tools";
    
    let tag = document.querySelector(`meta[name="description"]`);
    if(tag) tag.setAttribute('content', currentLang === 'hr' ? "Otkrijte i pretražite najbolje umjetne inteligencije (AI) alate za posao, edukaciju i svakodnevni život na jednom mjestu." : "Your ultimate directory for the best AI tools, web resources, and business software.");

    let canonical = document.getElementById('canonical-url');
    if (canonical) canonical.setAttribute('href', window.location.origin + window.location.pathname);
    
    let ldScript = document.getElementById('seo-json-ld');
    if (ldScript) ldScript.remove();
}

// --- Modal Functions ---
function openToolModal(toolId) {
    const tool = allTools.find(t => t.id === toolId);
    if (!tool) return;

    const badgeClass = tool.free === 'Free' ? 'badge-free' :
        (tool.free === 'Paid' ? 'badge-paid' : 'badge-freemium');

    const initial = tool.name.charAt(0).toUpperCase();
    const gradients = [
        'linear-gradient(135deg,#FF9F1C,#E63946)',
        'linear-gradient(135deg,#6C63FF,#E63946)',
        'linear-gradient(135deg,#00C9FF,#92FE9D)',
        'linear-gradient(135deg,#fc4a1a,#f7b733)',
        'linear-gradient(135deg,#8E2DE2,#4A00E0)',
        'linear-gradient(135deg,#11998e,#38ef7d)',
        'linear-gradient(135deg,#F953C6,#B91D73)',
        'linear-gradient(135deg,#1FA2FF,#12D8FA)',
    ];
    const gradientBg = gradients[initial.charCodeAt(0) % gradients.length];
    const modalImgHTML = tool.logo && tool.logo.trim() !== ''
        ? `<img src="${ASSET_PREFIX}${tool.logo}" alt="${tool.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:16px;"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
           <div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;background:${gradientBg};border-radius:16px;font-size:3rem;font-weight:900;color:#fff;">${initial}</div>`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${gradientBg};border-radius:16px;font-size:3rem;font-weight:900;color:#fff;">${initial}</div>`;

    // Use English description if available and selected
    let displayDesc = tool.desc;
    if (currentLang === 'en' && TOOL_DESCRIPTIONS_EN[tool.name]) {
        displayDesc = TOOL_DESCRIPTIONS_EN[tool.name];
    }

    // Extract tags from the tool object (limited to 4)
    const tags = (tool.tags || []).slice(0, 4);
    const tagsHTML = tags.length > 0 
        ? `<div class="modal-tags-container">
            ${tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('')}
           </div>`
        : '';

    modalBody.innerHTML = `
        <div class="modal-premium-header">
            ${modalImgHTML}
            <div class="modal-gradient-overlay"></div>
        </div>
        <div class="modal-premium-content">
            <span class="tool-badge ${badgeClass}" style="margin-bottom: 1rem;">${TRANSLATIONS[currentLang][tool.free.toLowerCase()] || tool.free}</span>
            <h2 class="tool-title">${tool.name}</h2>
            <div class="tool-tags" style="justify-content: center; margin-bottom: 2rem;">
                ${(tool.subcategories || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
            <p class="tool-desc" style="display: block !important; -webkit-line-clamp: unset !important; overflow: visible !important; min-height: auto !important; max-height: none !important; margin-bottom: 2rem;">${displayDesc}</p>
            ${tagsHTML}
            <a href="${tool.link}" target="_blank" class="btn-primary" rel="noopener noreferrer" style="margin-top: 2rem;">${TRANSLATIONS[currentLang].try_tool}</a>
        </div>
    `;

    toolModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll

    // URL Routing Update
    const slug = createSlug(tool.name);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('tool', slug);
    window.history.pushState({ toolId: slug }, '', newUrl.href);

    // Metadata Update
    updateSEOForTool({ ...tool, desc: displayDesc });
}

function closeToolModal(event) {
    // Only process if tool modal is actually open
    if (!toolModal.classList.contains('active')) return;
    toolModal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scroll

    // Clean URL
    const newUrl = new URL(window.location);
    newUrl.searchParams.delete('tool');
    
    // Only pushstate if the current URL actually has 'tool=XYZ' 
    // (prevents double push on popstate events)
    if (window.location.search.includes('tool=')) {
        window.history.pushState(null, '', newUrl.href);
    }
    
    resetSEO();
}

// Window History Popstate Integration
window.addEventListener('popstate', (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedSlug = urlParams.get('tool');

    if (requestedSlug) {
        const foundTool = allTools.find(t => createSlug(t.name) === requestedSlug);
        if (foundTool) {
            // Prevent pushing state again since we are navigating
            openToolModalWithoutHistory(foundTool);
        }
    } else {
        if (toolModal.classList.contains('active')) {
            toolModal.classList.remove('active');
            document.body.style.overflow = ''; 
            resetSEO();
        }
    }
});

// Helper for popstate to avoid history loop
function openToolModalWithoutHistory(tool) {
    if (!tool) return;
    // ... we can just call openToolModal but replace state ideally
    // for simplicity, we just use openToolModal and let it push state normally, 
    // but a cleaner approach is setting a flag.
    // For now, let's keep it robust by letting openToolModal run, then replacing it
    openToolModal(tool.id);
    window.history.replaceState({ toolId: createSlug(tool.name) }, '', window.location.href);
}

// --- Data Fetching ---
function fetchToolsFromAPI() {
    let data;
    if (window.WEBALATI_DATA) {
        data = window.WEBALATI_DATA;
    } else {
        // Fallback if data is missing
        showInitialSkeletonLoaders();
        if (trendingContainer) {
            trendingContainer.innerHTML = `<p class="error-msg">Nije moguće učitati podatke. Provjerite internetsku vezu.</p>`;
        }
        return;
    }

    try {
        let trendingArray = [];
        let toolsArray = [];

        // Handle both New Structure {trending, tools} and Old Structure [tools]
        if (data && !Array.isArray(data)) {
            // New Structure - using clean keys from Apps Script
            trendingArray = (data.trending || []).map((item, index) => {
                // Extract tags for trending too
                let tags = [];
                if (item.tags) {
                    if (Array.isArray(item.tags)) tags = item.tags;
                    else if (typeof item.tags === 'string') tags = item.tags.split(',').map(t => t.trim()).filter(t => t);
                }

                return {
                    id: `trending-${index}`,
                    logo: item.logo || '',
                    name: item.name || 'Nepoznat Alat',
                    desc: item.description || '',
                    link: item.link || '#',
                    category: item.category || 'Other',
                    trending: true,
                    lang: item.Language || 'hr',
                    free: item.free || item.Access || 'Freemium',
                    subcategories: item.subcategories || [],
                    tags: tags
                };
            });

            toolsArray = (data.tools || []).map((item, index) => {
                let category = item.category || "";

                // Optional subcategories
                let subcats = [];
                if (item.subcategories) {
                    if (Array.isArray(item.subcategories)) subcats = item.subcategories;
                    else if (typeof item.subcategories === 'string') subcats = item.subcategories.split(',').map(s => s.trim()).filter(s => s);
                }

                // Handle tags
                let tags = [];
                if (item.tags) {
                    if (Array.isArray(item.tags)) tags = item.tags;
                    else if (typeof item.tags === 'string') tags = item.tags.split(',').map(t => t.trim()).filter(t => t);
                }

                return {
                    id: `tool-${index}`,
                    logo: item.logo || '',
                    name: item.name || 'Nepoznat Alat',
                    desc: item.description || '',
                    link: item.link || '#',
                    category: category,
                    trending: false,
                    free: item.access || item.free || item.Access || 'Freemium',
                    subcategories: subcats,
                    tags: tags
                };
            });
        } else if (Array.isArray(data)) {
            // Old Structure Fallback
            data.forEach((item, index) => {
                let rawCategory = (item['Category'] || '').trim();
                if (rawCategory.toLowerCase() === 'slike') rawCategory = 'Dizajn';

                const isTrending = rawCategory.toLowerCase() === 'trending' ||
                    String(item['Trending']).trim().toLowerCase() === 'yes' ||
                    String(item['Trending']).trim().toLowerCase() === 'true';

                // Format category name (capitalize first letter)
                const formattedCategory = rawCategory ? rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase() : '';

                const toolObj = {
                    id: `old-${index}`,
                    logo: item['Logo'] || '',
                    name: item['Tool Name'] || 'Nepoznat Alat',
                    desc: item['Description'] || '',
                    link: item['Link'] || '#',
                    category: formattedCategory || (isTrending ? 'Trending' : ''),
                    trending: isTrending,
                    free: item['Access'] || item['Free'] || 'Freemium',
                    subcategories: (item['Subcategory'] || '').split(',').map(s => s.trim()).filter(s => s)
                };

                if (isTrending) trendingArray.push(toolObj);
                else toolsArray.push(toolObj);
            });
        }

        // Combine for internal state
        const fetchedTools = [...trendingArray, ...toolsArray];

        // Ensure we render immediately
        allTools = fetchedTools;
        allBlogs = data.blogs || [];

        populateFilters();
        if (homeView && homeView.classList.contains('active')) {
            renderTrendingTools();
        } else if (categoryView && categoryView.classList.contains('active')) {
            applyFilters();
        }

        // Render blog if we are on blog pages
        if (typeof renderBlogList === 'function') renderBlogList();
        if (typeof renderBlogPost === 'function') renderBlogPost();

        // Preload blog images for near-instant navigation
        preloadBlogImages();

        // Check if a tool was requested via URL query params and open it
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const requestedSlug = urlParams.get('tool');
            if (requestedSlug) {
                const foundTool = allTools.find(t => createSlug(t.name) === requestedSlug);
                if (foundTool) {
                    openToolModalWithoutHistory(foundTool);
                } else {
                    // Gracefully fallback if tool doesn't exist
                    const cleanUrl = new URL(window.location);
                    cleanUrl.searchParams.delete('tool');
                    window.history.replaceState(null, '', cleanUrl.href);
                }
            }
        }, 100);

    } catch (error) {
        console.error("Data parsing error:", error);
        if (trendingContainer) {
            trendingContainer.innerHTML = `<p class="error-msg">Došlo je do greške prilikom učitavanja.</p>`;
        }
    }
}

function showInitialSkeletonLoaders() {
    const skeletonHTML = Array(5).fill(`
        <div class="tool-card skeleton">
            <div class="tool-card-image skeleton-box"></div>
            <div class="tool-card-body">
                <div class="tool-title skeleton-box" style="width: 70%; height: 22px; margin-bottom: 0.8rem;"></div>
                <div class="tool-tags">
                    <div class="skeleton-box" style="width: 55px; height: 18px; border-radius:6px;"></div>
                    <div class="skeleton-box" style="width: 45px; height: 18px; border-radius:6px;"></div>
                </div>
                <div class="tool-desc skeleton-box" style="width: 100%; height: 14px; margin-top: 0.8rem;"></div>
                <div class="tool-desc skeleton-box" style="width: 80%; height: 14px; margin-top: 0.4rem;"></div>
                <div class="btn-primary skeleton-box" style="margin-top: auto;"></div>
            </div>
        </div>
    `).join('');

    if (trendingContainer) trendingContainer.innerHTML = skeletonHTML;
    if (categoryToolsContainer) categoryToolsContainer.innerHTML = skeletonHTML;
}

// Populate the Category and Subcategory filter dropdowns dynamically
function populateFilters() {
    // Guard: this only runs on pages that have the filter dropdowns (index.html)
    if (!filterCategory) return;

    // Keep 'all' option, remove others
    while (filterCategory.options.length > 1) {
        filterCategory.remove(1);
    }
    if (filterSubcategory) {
        while (filterSubcategory.options.length > 1) {
            filterSubcategory.remove(1);
        }
    }

    const uniqueCategories = new Set();
    const uniqueSubcategories = new Set();
    const uniqueTags = new Set();

    allTools.forEach(tool => {
        if (tool.category && tool.category.toLowerCase() !== 'trending') {
            const formattedCat = tool.category.charAt(0).toUpperCase() + tool.category.slice(1).toLowerCase();
            uniqueCategories.add(formattedCat);
            tool.category = formattedCat;
        }
        if (tool.subcategories) {
            tool.subcategories.forEach(sub => {
                if (sub) {
                    const normalizedSub = sub.trim();
                    const allowedSub = ALLOWED_SUBCATEGORIES.find(s => s.toLowerCase() === normalizedSub.toLowerCase());
                    if (allowedSub) {
                        uniqueSubcategories.add(allowedSub);
                    }
                }
            });
        }
        // Extract tags robustly
        let tags = [];
        if (Array.isArray(tool.tags)) {
            tags = tool.tags;
        } else if (typeof tool.tags === 'string' && tool.tags.trim() !== '') {
            tags = tool.tags.split(',').map(t => t.trim()).filter(t => t !== '');
        }

        tags.forEach(tag => {
            if (tag) {
                const formattedTag = tag.trim().charAt(0).toUpperCase() + tag.trim().slice(1).toLowerCase();
                uniqueTags.add(formattedTag);
            }
        });
    });

    Array.from(uniqueCategories).sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = (currentLang === 'hr' && TRANSLATIONS[currentLang][`cat_${cat.toLowerCase()}`])
            ? TRANSLATIONS[currentLang][`cat_${cat.toLowerCase()}`]
            : cat;
        filterCategory.appendChild(option);
    });

    if (filterSubcategory) {
        Array.from(uniqueSubcategories).sort().forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            filterSubcategory.appendChild(option);
        });
    }

    if (filterTag) {
        // Clear except first option
        while (filterTag.options.length > 1) {
            filterTag.remove(1);
        }
        Array.from(uniqueTags).sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            filterTag.appendChild(option);
        });
    }
}

// --- Rendering Logic ---

// Helper: Get Badge Class based on Free/Paid status
function getBadgeClass(status) {
    if (!status) return 'badge-freemium';
    const s = status.toLowerCase();
    if (s === 'free' || s === 'besplatno') return 'badge-free';
    if (s === 'paid' || s === 'plaćeno' || s === 'placeno') return 'badge-paid';
    return 'badge-freemium';
}

// Helper: Display label for badge
function getBadgeLabel(status) {
    if (!status) return 'Freemium';
    const s = status.toLowerCase();
    if (s === 'free' || s === 'besplatno') return 'Free';
    if (s === 'paid' || s === 'plaćeno' || s === 'placeno') return 'Paid';
    return 'Freemium';
}

// Helper: Create HTML for a single Tool Card
function createToolCardHTML(tool) {
    const badgeClass = getBadgeClass(tool.free);
    const initial = tool.name.charAt(0).toUpperCase();
    // Accent colours per initial letter for gradient fallback
    const gradients = [
        'linear-gradient(135deg,#FF9F1C,#E63946)',
        'linear-gradient(135deg,#6C63FF,#E63946)',
        'linear-gradient(135deg,#00C9FF,#92FE9D)',
        'linear-gradient(135deg,#fc4a1a,#f7b733)',
        'linear-gradient(135deg,#8E2DE2,#4A00E0)',
        'linear-gradient(135deg,#11998e,#38ef7d)',
        'linear-gradient(135deg,#F953C6,#B91D73)',
        'linear-gradient(135deg,#1FA2FF,#12D8FA)',
    ];
    const gradientBg = gradients[initial.charCodeAt(0) % gradients.length];

    // Update the hover label content dynamically
    const hoverText = TRANSLATIONS[currentLang].details;
    document.documentElement.style.setProperty('--card-hover-text', `"${hoverText}"`);

    // Full-width image or stylised fallback
    let imageHTML;
    if (tool.logo && tool.logo.trim() !== '') {
        const imgSrc = tool.logo.startsWith('http') ? tool.logo : ASSET_PREFIX + tool.logo;
        imageHTML = `<img src="${imgSrc}" alt="${tool.name}" loading="lazy" decoding="async"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div class="tool-img-fallback" style="background:${gradientBg};display:none;">
                <span>${initial}</span>
            </div>`;
    } else {
        imageHTML = `<div class="tool-img-fallback" style="background:${gradientBg};">
            <span>${initial}</span>
        </div>`;
    }

    const badgeLabel = getBadgeLabel(tool.free);

    // Use English description if available and selected
    let displayDesc = tool.desc;
    if (currentLang === 'en' && TOOL_DESCRIPTIONS_EN[tool.name]) {
        displayDesc = TOOL_DESCRIPTIONS_EN[tool.name];
    }

    let displayTagsHTML = '';
    (tool.subcategories || []).forEach(tag => {
        displayTagsHTML += `<span class="tag">${tag}</span>`;
    });

    return `
        <div class="tool-card" data-id="${tool.id}">
            <div class="tool-card-image">
                ${imageHTML}
                <span class="tool-badge ${badgeClass} badge-overlay">${TRANSLATIONS[currentLang][tool.free.toLowerCase()] || tool.free}</span>
            </div>
            <div class="tool-card-body">
                <h3 class="tool-title">${tool.name}</h3>
                <div class="tool-tags">
                    ${displayTagsHTML}
                </div>
                <p class="tool-desc">${displayDesc}</p>
                <a href="${tool.link}" target="_blank" class="btn-primary" rel="noopener noreferrer">${TRANSLATIONS[currentLang].try_tool}</a>
            </div>
        </div>
    `;
}

// --- Modal helpers ---
function openModal(modalEl) {
    modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalEl) {
    modalEl.classList.remove('active');
    // Only restore scroll if no other modal is open
    if (!document.querySelector('.modal.active')) {
        document.body.style.overflow = '';
    }
}

function showSuccessModal(title, message, isNewsletter = false) {
    document.getElementById('success-title').textContent = title;
    document.getElementById('success-message').textContent = message;
    
    // Toggle PDF download button for newsletters
    const successBody = document.querySelector('.success-modal-body');
    const existingDownloadBtn = document.getElementById('success-download-btn');
    if (existingDownloadBtn) existingDownloadBtn.remove();

    if (isNewsletter) {
        const downloadBtn = document.createElement('a');
        downloadBtn.id = 'success-download-btn';
        const pdfFile = currentLang === 'en'
            ? 'Prompt Engineering Guide EN.pdf'
            : 'Prompt Engineering Vodič HR.pdf';
        downloadBtn.href = ASSET_PREFIX + 'PDF/' + pdfFile;
        downloadBtn.className = 'btn-primary';
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.style.alignItems = 'center';
        downloadBtn.style.justifyContent = 'center';
        downloadBtn.style.marginTop = '1.5rem';
        downloadBtn.style.width = 'auto';
        downloadBtn.style.padding = '0.9rem 2.2rem';
        downloadBtn.download = pdfFile;
        downloadBtn.innerHTML = `<i class="fa-solid fa-file-pdf" style="margin-right: 0.8rem;"></i> ${TRANSLATIONS[currentLang].download_pdf_btn}`;
        
        // Insert before the close button
        const closeBtn = document.getElementById('success-close-btn');
        successBody.insertBefore(downloadBtn, closeBtn);
    }
    
    openModal(successModal);
}


// --- Newsletter Form ---
async function handleNewsletterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('nl-name').value.trim();
    const email = document.getElementById('nl-email').value.trim();
    const terms = document.getElementById('nl-terms').checked;
    const errorEl = document.getElementById('nl-error');
    const submitBtn = document.getElementById('nl-submit-btn');

    errorEl.textContent = '';
    const t = TRANSLATIONS[currentLang];

    if (!name) { errorEl.textContent = t.error_name; return; }
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) { errorEl.textContent = t.error_email; return; }
    if (!terms) { errorEl.textContent = t.error_terms; return; }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t.submitting}`;

    try {
        const ts = Date.now();
        const formData = new URLSearchParams();
        formData.append('ime', name);
        formData.append('email', email);
        formData.append('type', 'newsletter');
        formData.append('token', FORM_TOKEN);
        formData.append('ts', ts);

        const response = await fetch(NEWSLETTER_API, {
            method: 'POST',
            body: formData
        });

        // Log any server-side errors for debugging
        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.error('Newsletter API error:', response.status, errText);
        }

        // Apps Script processes POST even with CORS limitations; proceed on no hard network error.
        closeModal(newsletterModal);
        document.getElementById('newsletter-form').reset();
        showSuccessModal(t.success_nl_title, t.success_nl_msg, true);
    } catch (err) {
        console.error('Newsletter submit error:', err);
        errorEl.textContent = t.error_try_again;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${t.subscribe_btn}`;
    }
}

// --- Contact Form ---
async function handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const phone = document.getElementById('cf-phone').value.trim();
    const message = document.getElementById('cf-message').value.trim();
    const terms = document.getElementById('cf-terms').checked;
    const errorEl = document.getElementById('cf-error');
    const submitBtn = document.getElementById('cf-submit-btn');

    errorEl.textContent = '';
    const t = TRANSLATIONS[currentLang];

    if (!name) { errorEl.textContent = t.error_name; return; }
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) { errorEl.textContent = t.error_email; return; }
    if (!message) { errorEl.textContent = t.error_message; return; }
    if (!terms) { errorEl.textContent = t.error_terms; return; }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t.submitting}`;

    try {
        const ts = Date.now();
        const formData = new URLSearchParams();
        formData.append('fullName', name);
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('message', message);
        formData.append('type', 'contact');
        formData.append('token', FORM_TOKEN);
        formData.append('ts', ts);

        const response = await fetch(CONTACT_API, {
            method: 'POST',
            body: formData
        });

        // Log any server-side errors for debugging
        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            console.error('Contact API error:', response.status, errText);
        }

        closeModal(contactModal);
        document.getElementById('contact-form').reset();
        showSuccessModal(t.success_cf_title, t.success_cf_msg);
    } catch (err) {
        console.error('Contact submit error:', err);
        errorEl.textContent = t.error_try_again;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${t.send_btn}`;
    }
}

function renderTrendingTools() {
    if (!trendingContainer) return;
    const trendingTools = allTools.filter(tool => tool.trending).slice(0, 5);

    if (trendingTools.length === 0) {
        trendingContainer.innerHTML = `<p class="error-msg">Nisu pronađeni popularni alati.</p>`;
        return;
    }

    // Use DocumentFragment for performance
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');

    trendingTools.forEach(tool => {
        tempDiv.innerHTML = createToolCardHTML(tool);
        fragment.appendChild(tempDiv.firstElementChild);
    });

    trendingContainer.innerHTML = '';
    trendingContainer.appendChild(fragment);
}

// --- Full Filtering Engine ---
function applyFilters() {
    let filtered = [...allTools];

    // 1. Search Query (Everything: Name, Desc, Tags, Access)
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    if (query) {
        filtered = filtered.filter(tool => {
            const nameMatch = (tool.name || "").toLowerCase().includes(query);
            const descMatch = (tool.desc || "").toLowerCase().includes(query);
            const subcatMatch = (tool.subcategories || []).some(s => s.toLowerCase().includes(query));
            const tagsMatch = (tool.tags || []).some(t => t.toLowerCase().includes(query));
            const accessMatch = String(tool.free || "").toLowerCase().includes(query);
            const catMatch = String(tool.category || "").toLowerCase().includes(query);

            return nameMatch || descMatch || subcatMatch || tagsMatch || accessMatch || catMatch;
        });
    }

    // 2. Category Filter (Matches Category exactly)
    if (!filterCategory) return;
    const selectedCat = filterCategory.value;
    if (selectedCat !== 'all') {
        const lowerCat = selectedCat.toLowerCase();
        filtered = filtered.filter(tool => {
            return (tool.category || "").toLowerCase() === lowerCat;
        });
        categoryTitle.textContent = selectedCat;
    } else {
        categoryTitle.textContent = query ? (currentLang === 'hr' ? `Pretraga: "${query}"` : `Search: "${query}"`) : (currentLang === 'hr' ? "Svi Alati" : "All Tools");
    }

    // 2.5. Subcategory Filter (Matches Subcategories)
    if (filterSubcategory) {
        const selectedSub = filterSubcategory.value;
        if (selectedSub !== 'all') {
            const lowerSub = selectedSub.toLowerCase();
            filtered = filtered.filter(tool => {
                return (tool.subcategories || []).some(s => s.toLowerCase() === lowerSub);
            });
        }
    }

    // 3. Access Filter (Free/Paid)
    if (!filterAccess) return;
    const selectedAccess = filterAccess.value;
    if (selectedAccess !== 'all') {
        filtered = filtered.filter(tool => {
            const toolFree = String(tool.free || "").toLowerCase();
            if (selectedAccess === 'besplatno') return toolFree.includes('free') && !toolFree.includes('freemium');
            if (selectedAccess === 'plaćeno') return toolFree.includes('paid') || toolFree.includes('plaćeno') || toolFree.includes('placeno');
            if (selectedAccess === 'freemium') return toolFree.includes('freemium');
            return true;
        });
    }

    // 4. Tag Filter
    if (filterTag) {
        const selectedTag = filterTag.value;
        if (selectedTag !== 'all') {
            const lowerTag = selectedTag.toLowerCase();
            filtered = filtered.filter(tool => {
                return (tool.tags || []).some(t => t.toLowerCase() === lowerTag);
            });
        }
    }



    renderToolsList(filtered);
}

function renderToolsList(toolsArray) {
    if (!categoryToolsContainer) return;
    if (toolsArray.length === 0) {
        categoryToolsContainer.innerHTML = `<p class="error-msg">Nema rezultata za odabrane filtere.</p>`;
        loadMoreContainer.style.display = 'none';
        return;
    }

    const paginatedTools = toolsArray.slice(0, currentDisplayCount);

    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');

    paginatedTools.forEach(tool => {
        tempDiv.innerHTML = createToolCardHTML(tool);
        fragment.appendChild(tempDiv.firstElementChild);
    });

    categoryToolsContainer.innerHTML = '';
    categoryToolsContainer.appendChild(fragment);

    loadMoreContainer.style.display = toolsArray.length > currentDisplayCount ? 'block' : 'none';
}

// --- Safe Multi-Language Accessor ---
function getLocalVal(field, targetLang) {
    if (field == null) return '';
    if (typeof field === 'object' && !Array.isArray(field)) {
        return field[targetLang] || field['HR'] || Object.values(field)[0] || '';
    }
    return field;
}

// --- Dynamic Blog Render Functions ---
function showBlogList(e) {
    if (e) e.preventDefault();
    const listView = document.getElementById('blog-list-view');
    const postView = document.getElementById('post-view');
    const blogNav = document.getElementById('blog-nav-link');
    const backNav = document.getElementById('back-nav-link');

    if (listView) listView.style.display = 'block';
    if (postView) postView.classList.remove('active');
    if (blogNav) blogNav.style.display = 'inline-block';
    if (backNav) backNav.style.display = 'none';

    window.scrollTo({ top: 0, behavior: 'instant' });
    history.pushState(null, "", "./");
    renderBlogList();
}

function showBlogPost(slug) {
    const listView = document.getElementById('blog-list-view');
    const postView = document.getElementById('post-view');
    const blogNav = document.getElementById('blog-nav-link');
    const backNav = document.getElementById('back-nav-link');

    if (listView) listView.style.display = 'none';
    if (postView) postView.classList.add('active');
    if (blogNav) blogNav.style.display = 'inline-block';
    if (backNav) backNav.style.display = 'inline-block';

    window.scrollTo({ top: 0, behavior: 'instant' });
    history.pushState(null, "", "?slug=${slug}");
    renderBlogPost();
}

function renderBlogList() {
    const blogGrid = document.getElementById('blog-grid');
    console.log("renderBlogList called. blogGrid exists:", !!blogGrid);
    if (!blogGrid) return;
    console.log("allBlogs count:", (allBlogs || []).length);

    // Check for slug in URL on load
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    if (slug) {
        const listView = document.getElementById('blog-list-view');
        const postView = document.getElementById('post-view');
        if (listView) listView.style.display = 'none';
        if (postView) postView.classList.add('active');
    }

    blogGrid.innerHTML = '';
    const targetLang = currentLang === 'hr' ? 'HR' : 'ENGL';

    // Filter to blogs that have a non-empty Heading (real content)
    const blogsToRender = (window.WEBALATI_DATA.blogs || []).filter(b => {
        if (!b) return false;
        const heading = getLocalVal(b.Heading, targetLang);
        return heading && String(heading).trim() !== '';
    });

    if (blogsToRender.length === 0) {
        const noPostsMsg = currentLang === 'hr'
            ? 'Trenutno nema objavljenih članaka. Uskoro!'
            : 'No blog posts published yet. Coming soon!';
        blogGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--text-secondary);margin-top:2rem;font-size:1.1rem;">${noPostsMsg}</p>`;
        return;
    }

    let html = '';
    try {
        blogsToRender.forEach(blog => {
        const title = String(getLocalVal(blog.Heading, targetLang) || '');
        const minutes = String(getLocalVal(blog.Minutes, targetLang) || '5');
        const photo = String(getLocalVal(blog.Photo, targetLang) || '');
        const text1 = String(getLocalVal(blog.Text1 || blog["Text 1"], targetLang) || '');
        const blogSlug = String(getLocalVal(blog.Slug, targetLang) || title.toLowerCase().replace(/\\s+/g, '-'));

        let subheadingHR = currentLang === 'hr' ? ` • ${minutes} MIN ČITANJA` : ` • ${minutes} MIN READ`;
        let categoryText = title.toUpperCase() + subheadingHR;

        // Use showBlogPost instead of direct link redirection
        const clickAction = `showBlogPost('${blogSlug.replace(/'/g, "\\'")}')`;

        html += `
        <article class="blog-card" style="cursor:pointer;" onclick="${clickAction}">
            <div class="blog-card-header">
                <img src="${ASSET_PREFIX}${photo}" alt="${title}" class="blog-img" loading="lazy" onerror="this.style.display='none'">
            </div>
            <div class="blog-content">
                <span class="blog-meta">${categoryText}</span>
                <h2 class="blog-title">${title}</h2>
                <p class="blog-excerpt">${text1 ? text1.substring(0, 120) + '...' : ''}</p>
                <a href="javascript:void(0)" class="read-more" onclick="${clickAction}">
                    ${currentLang === 'hr' ? 'Pročitaj više' : 'Read more'} <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        </article>
        `;
        });
    } catch (err) {
        // Fail silently in production to avoid disruption, or log to a service.
    }
    blogGrid.innerHTML = html;
}

function renderBlogPost() {
    const postContainer = document.getElementById('dynamic-post');
    if (!postContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    if (!slug) return;

    const targetLang = currentLang === 'hr' ? 'HR' : 'ENGL';

    // Find matching slug (case insensitive, robust)
    const blog = allBlogs.find(b => {
        if (!b) return false;
        const titleStr = String(getLocalVal(b.Heading, targetLang) || '');
        const bSlug = String(getLocalVal(b.Slug, targetLang) || titleStr.toLowerCase().replace(/\s+/g, '-')).trim();
        const searchSlug = String(slug).trim();

        return bSlug === searchSlug;
    });

    if (!blog) {
        postContainer.innerHTML = '<p>Objava nije pronađena / Post not found</p>';
        return;
    }

    const title = String(getLocalVal(blog.Heading, targetLang) || '');
    const minutes = String(getLocalVal(blog.Minutes, targetLang) || '5');
    const timestamp = String(getLocalVal(blog.Timestamp, targetLang) || '');
    const photo = String(getLocalVal(blog.Photo, targetLang) || '');

    const mainText = String(getLocalVal(blog.MainText || blog["Main Text"], targetLang) || '');
    const text1 = String(getLocalVal(blog.Text1 || blog["Text 1"], targetLang) || '');
    const subHeading1 = String(getLocalVal(blog.Subheading || blog["Subheading"], targetLang) || '');
    const text2 = String(getLocalVal(blog.Text2 || blog["Text 2"], targetLang) || '');
    const highlighted = String(getLocalVal(blog.HighlitedText || blog["Highlighted Text"] || blog.HighlightedText, targetLang) || '');
    const subHeading2 = String(getLocalVal(blog.Subheading2 || blog["Subheading 2"], targetLang) || '');
    const text3 = String(getLocalVal(blog.Text3 || blog["Text 3"], targetLang) || '');
    const buttonLink = String(getLocalVal(blog.ButtonLink || blog["Button Link"], targetLang) || '');

    let metaText = currentLang === 'hr' ? ` • ${minutes} MIN ČITANJA` : ` • ${minutes} MIN READ`;
    let topMeta = (timestamp ? timestamp : '') + metaText;
    const btntxt = currentLang === 'hr' ? 'Isprobaj Alat' : 'Try Tool';

    postContainer.innerHTML = `
        <header class="post-header">
            <span class="post-meta">${topMeta}</span>
            <h1 class="post-title">${title}</h1>
        </header>

        <img src="${ASSET_PREFIX}${photo}" alt="${title}" class="post-featured-img" onerror="this.style.display='none'">

        <div class="post-body">
            ${mainText ? `<p>${mainText}</p>` : ''}

            ${subHeading1 ? `<h2>${subHeading1}</h2>` : ''}

            ${text1 ? `<p>${text1}</p>` : ''}
            ${text2 ? `<p>${text2}</p>` : ''}

            ${highlighted ? `<blockquote style="border-left: 4px solid var(--accent-color); padding-left: 2rem; margin: 3rem 0; font-style: italic; color: var(--text-primary); font-size: 1.4rem;">"${highlighted}"</blockquote>` : ''}

            ${subHeading2 ? `<h2>${subHeading2}</h2>` : ''}
            ${text3 ? `<p>${text3}</p>` : ''}

            ${buttonLink ? `
            <div class="post-cta-container">
                <a href="${buttonLink}" target="_blank" class="btn-primary">
                    ${btntxt} <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Preload all blog images to ensure instant transitions when clicking blog posts.
 */
function preloadBlogImages() {
    if (!allBlogs || allBlogs.length === 0) return;
    
    allBlogs.forEach(blog => {
        const targetLang = currentLang === 'hr' ? 'HR' : 'ENGL';
        const photo = getLocalVal(blog.Photo, targetLang);
        if (photo) {
            const img = new Image();
            img.src = ASSET_PREFIX + photo;
        }
    });
}
