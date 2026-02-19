document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initDropdown();
    
    // CORRECTION: Function name must match the one defined below
    initProgressBackToTop(); 
    
    initSmoothScroll();
    initGalleryCollections();
    initLightbox();
    initContactForm();
    initAnimations();
});


// 1. MOBILE MENU TOGGLE
function initMobileMenu() {
    const mobileToggle = document.getElementById('mobileToggle'); // Ensure ID exists in index.html
    const navMenu = document.getElementById('navMenu'); // Ensure ID exists in index.html
    
    if (!mobileToggle || !navMenu) return;
    
    // Toggle menu on button click
    mobileToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking a link (mobile view)
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (!this.classList.contains('dropdown-btn') && window.innerWidth <= 768) {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    // Close menu when resizing beyond mobile breakpoint
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            mobileToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}


// 2. DROPDOWN MENU
function initDropdown() {
    const dropdownBtn = document.getElementById('worksDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (!dropdownBtn || !dropdownMenu) return;
    
    // Toggle on click
    dropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.classList.toggle('active');
        dropdownMenu.classList.toggle('active');
    });
    
    // Close when clicking outside the menu
    document.addEventListener('click', function(e) {
        if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownBtn.classList.remove('active');
            dropdownMenu.classList.remove('active');
        }
    });
}


// 3. PROGRESS BACK TO TOP BUTTON (Circular Scroll)
function initProgressBackToTop() {
    const progressWrap = document.getElementById('progressWrap');
    if (!progressWrap) return;

    // A. Setup SVG Path for animation
    const progressPath = progressWrap.querySelector('path');
    const pathLength = progressPath.getTotalLength();

    // Reset styles to prepare for animation
    progressPath.style.transition = 'none';
    progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect(); // Trigger layout
    progressPath.style.transition = 'stroke-dashoffset 10ms linear';

    // B. Calculate scroll percentage
    const updateProgress = function() {
        const scroll = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        const progress = pathLength - (scroll * pathLength / height);
        progressPath.style.strokeDashoffset = progress;
    }

    updateProgress();
    window.addEventListener('scroll', updateProgress);

    // C. Show/Hide button based on scroll position
    const offset = 50; 
    window.addEventListener('scroll', function() {
        if (window.scrollY > offset) {
            progressWrap.classList.add('active-progress');
        } else {
            progressWrap.classList.remove('active-progress');
        }
    });

    // D. Click to Scroll Up
    progressWrap.addEventListener('click', function(event) {
        event.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


// 4. SMOOTH SCROLLING FOR ANCHOR LINKS
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Ignore empty links or special triggers (dropdown/gallery cards)
            if (href === '#' || 
                this.classList.contains('dropdown-btn') || 
                this.classList.contains('collection-card')) {
                return;
            }
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                // Offset for fixed header
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}


// 5. GALLERY COLLECTIONS LOGIC
function initGalleryCollections() {
    const collectionCards = document.querySelectorAll('.collection-card');
    const collections = document.querySelectorAll('.gallery-collection');
    const closeButtons = document.querySelectorAll('.close-collection');
    
    // Handle clicking a collection card 
    collectionCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const collectionId = this.getAttribute('href'); // e.g., #nature-collection
            const targetCollection = document.querySelector(collectionId);
            
            // 1. Hide all currently open collections
            collections.forEach(c => c.classList.remove('active'));
            
            // 2. Show the target collection
            if (targetCollection) {
                targetCollection.classList.add('active');
                
                // 3. Smooth scroll to the newly opened section
                setTimeout(() => {
                    const headerOffset = 100;
                    const elementPosition = targetCollection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }, 50); // Small delay to ensure DOM update
            }
        });
    });
    
    // Handle the "X" close button inside a collection
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const collection = this.closest('.gallery-collection');
            if (collection) {
                collection.classList.remove('active');
                
                // Scroll back up to the main Gallery section
                const gallerySection = document.getElementById('gallery');
                if (gallerySection) {
                    const headerOffset = 80;
                    const elementPosition = gallerySection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }
        });
    });
}


// 6. LIGHTBOX (IMAGE VIEWER)
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    
    if (!lightbox) return;
    
    let currentImageIndex = 0;
    let currentGalleryItems = []; 
    let isDataLightbox = false; 

    // --- Event Delegation ---
    document.body.addEventListener('click', function(e) {
        // 1. Check for clicks on new data-lightbox triggers (Blog Images)
        const lightboxTrigger = e.target.closest('a[data-lightbox]');
        if (lightboxTrigger) {
            e.preventDefault();
            const groupName = lightboxTrigger.getAttribute('data-lightbox');
            // Get all items belonging to the same group (e.g., "blogs")
            currentGalleryItems = Array.from(document.querySelectorAll(`a[data-lightbox="${groupName}"]`));
            currentImageIndex = currentGalleryItems.indexOf(lightboxTrigger);
            openLightbox(true); // Pass true to indicate it's a data-lightbox item
            return;
        }

        // 2. Check for clicks on existing gallery-items (Gallery Section)
        const item = e.target.closest('.gallery-item');
        if (item) {
            const collection = item.closest('.gallery-collection');
            if(collection) {
                currentGalleryItems = Array.from(collection.querySelectorAll('.gallery-item'));
                currentImageIndex = currentGalleryItems.indexOf(item);
                openLightbox(false); // Pass false for a gallery item
            }
        }
    });
    
    // Close Button
    if(lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    
    // Close on background click
    lightbox.addEventListener('click', function(e) {
        if (e.target === this) closeLightbox();
    });
    
    // Previous Button
    if(lightboxPrev) {
        lightboxPrev.addEventListener('click', function() {
            if (currentGalleryItems.length === 0) return;
            currentImageIndex = (currentImageIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
            updateLightboxContent();
        });
    }
    
    // Next Button
    if(lightboxNext) {
        lightboxNext.addEventListener('click', function() {
            if (currentGalleryItems.length === 0) return;
            currentImageIndex = (currentImageIndex + 1) % currentGalleryItems.length;
            updateLightboxContent();
        });
    }
    
    // Keyboard Navigation
    document.addEventListener('keydown', function(e) {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && lightboxPrev) lightboxPrev.click();
        if (e.key === 'ArrowRight' && lightboxNext) lightboxNext.click();
    });
    
    function openLightbox(isFromDataAttribute) {
        isDataLightbox = isFromDataAttribute; // Store the type
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateLightboxContent();
    }
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    function updateLightboxContent() {
        const currentItem = currentGalleryItems[currentImageIndex];
        
        // Clear previous content
        lightboxImage.innerHTML = '';
        lightboxCaption.textContent = '';

        if (isDataLightbox) {
            // --- Logic for Blog Images (data-lightbox) ---
            const largeImageSrc = currentItem.getAttribute('href');
            const captionText = currentItem.getAttribute('data-caption');

            // Create a new image element for the lightbox
            const img = document.createElement('img');
            img.src = largeImageSrc;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '80vh'; 
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
            
            lightboxImage.appendChild(img);

            if (captionText) {
                lightboxCaption.textContent = captionText;
            }

        } else {
            // --- Logic for Gallery placeholders (Existing) ---
            const placeholder = currentItem.querySelector('.gallery-placeholder');
            const caption = currentItem.querySelector('.gallery-caption');
            
            if (placeholder) {
                const clonedDiv = placeholder.cloneNode(true);
                clonedDiv.style.width = '80vw'; 
                clonedDiv.style.height = '60vh';
                clonedDiv.style.borderRadius = '8px';
                lightboxImage.appendChild(clonedDiv);
            }
            
            if (caption) {
                lightboxCaption.textContent = caption.textContent;
            }
        }
    }
}


// 7. CONTACT FORM HANDLER
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = 'Sending...';
        submitBtn.style.opacity = '0.7';
        
        setTimeout(() => {
            alert('Thank you for your message! Since this is a portfolio demo, no email was actually sent.');
            form.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.style.opacity = '1';
        }, 1500);
    });
}


// 8. SCROLL ANIMATIONS
function initAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);
    const animateElements = document.querySelectorAll(
        '.about-grid, .featured-work-card, .collection-card, .contact-container'
    );
    
    animateElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        
        observer.observe(el);
    });
}