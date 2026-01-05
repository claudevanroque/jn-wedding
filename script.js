// Get the guest name from URL parameter
document.addEventListener('DOMContentLoaded', function() {
    // Always start at the hero when loading/refeshing
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);

    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('to');
    
    if (guestName) {
        const decodedName = decodeURIComponent(guestName).replace(/\+/g, ' ');
        document.querySelector('.guest-name').textContent = decodedName;
    }

    // Start countdown timer
    startCountdown();

    // Setup music control button
    setupMusicControl();

    // Trigger scroll-based intro animations
    setupScrollAnimations();

    // Parallax-like scroll for quote image
    setupQuoteImageParallax();

    // Parallax for bottom quote image
    setupBottomQuoteImageParallax();

    // Slide-in for quote text and author
    setupQuoteTextSlides();

    // Setup video play functionality
    setupVideoPlayer();
});

// Setup video player
function setupVideoPlayer() {
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            const videoFrame = document.querySelector('.video-frame');
            const video = document.createElement('video');
            video.width = '100%';
            video.height = '100%';
            video.controls = true;
            video.muted = false;
            video.src = 'The Most Cinematic Wedding Trailer You ll Ever See.mp4';
            videoFrame.innerHTML = '';
            videoFrame.appendChild(video);
            videoFrame.classList.add('playing');
            video.addEventListener('canplay', () => {
                video.play().then(() => {
                    // Stop background music when video plays
                    const bgMusic = document.getElementById('background-music');
                    if (bgMusic) {
                        bgMusic.pause();
                    }
                }).catch(e => alert('Play failed: ' + e.message));
            });
        });
    }
}

// Setup music control
function setupMusicControl() {
    const audio = document.getElementById('background-music');
    const musicBtn = document.createElement('button');
    musicBtn.className = 'music-control paused';
    musicBtn.setAttribute('aria-label', 'Toggle music');
    
    document.body.appendChild(musicBtn);
    
    musicBtn.addEventListener('click', function() {
        if (audio.paused) {
            audio.play();
            musicBtn.classList.remove('paused');
            musicBtn.classList.add('playing');
        } else {
            audio.pause();
            musicBtn.classList.remove('playing');
            musicBtn.classList.add('paused');
        }
    });
}

// Scroll to section function
function scrollToSection(selector) {
    const heroSection = document.querySelector('.hero');
    const splitLayout = document.querySelector('.split-layout');
    const audio = document.getElementById('background-music');
    
    // Fade out hero
    heroSection.style.opacity = '0';
    heroSection.style.pointerEvents = 'none';
    
    setTimeout(() => {
        // Hide hero
        heroSection.style.display = 'none';
        
        // Show split layout
        splitLayout.classList.add('active');
        
        // Enable scrolling
        document.body.style.overflow = 'auto';
        
        // Start playing music
        audio.play();
        
        // Update music button state
        const musicBtn = document.querySelector('.music-control');
        if (musicBtn) {
            musicBtn.classList.remove('paused');
            musicBtn.classList.add('playing');
        }
        
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }, 500);
}

// Countdown Timer
function startCountdown() {
    const targetDate = new Date('December 8, 2024 13:00:00').getTime();
    const jnTargetDate = new Date('February 28, 2026 00:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        
        // Update main countdown (Ruther & Edda)
        const distance = targetDate - now;
        
        if (distance < 0) {
            // Wedding has passed
            const countdownElements = document.querySelectorAll('.countdown-value');
            countdownElements.forEach(el => el.textContent = '0');
        } else {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            const countdownItems = document.querySelectorAll('.countdown-item');
            if (countdownItems.length >= 4) {
                countdownItems[0].querySelector('.countdown-value').textContent = days;
                countdownItems[1].querySelector('.countdown-value').textContent = hours;
                countdownItems[2].querySelector('.countdown-value').textContent = minutes;
                countdownItems[3].querySelector('.countdown-value').textContent = seconds;
            }
        }
        
        // Update Justine & Nica countdown
        const jnDistance = jnTargetDate - now;
        
        if (jnDistance < 0) {
            const jnCountdownElements = document.querySelectorAll('.jn-countdown-value');
            jnCountdownElements.forEach(el => el.textContent = '0');
        } else {
            const jnDays = Math.floor(jnDistance / (1000 * 60 * 60 * 24));
            const jnHours = Math.floor((jnDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const jnMinutes = Math.floor((jnDistance % (1000 * 60 * 60)) / (1000 * 60));
            const jnSeconds = Math.floor((jnDistance % (1000 * 60)) / 1000);
            
            const jnCountdownItems = document.querySelectorAll('.jn-countdown-item');
            if (jnCountdownItems.length >= 4) {
                jnCountdownItems[0].querySelector('.jn-countdown-value').textContent = jnDays;
                jnCountdownItems[1].querySelector('.jn-countdown-value').textContent = jnHours;
                jnCountdownItems[2].querySelector('.jn-countdown-value').textContent = jnMinutes;
                jnCountdownItems[3].querySelector('.jn-countdown-value').textContent = jnSeconds;
            }
        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// RSVP Form Submission
document.addEventListener('DOMContentLoaded', function() {
    const rsvpForm = document.querySelector('.rsvp-form');
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your RSVP! We will confirm your attendance shortly.');
            rsvpForm.reset();
        });
    }

    // Comment Form Submission
    const commentForm = document.querySelector('.comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = commentForm.querySelector('input[type="text"]');
            const messageInput = commentForm.querySelector('textarea');
            
            if (nameInput.value.trim() && messageInput.value.trim()) {
                const newComment = document.createElement('div');
                newComment.className = 'comment';
                newComment.innerHTML = `
                    <p class="comment-author">${nameInput.value}</p>
                    <p class="comment-time">just now</p>
                    <p class="comment-text">${messageInput.value}</p>
                `;
                
                const commentsList = document.querySelector('.comments-list');
                commentsList.insertBefore(newComment, commentsList.firstChild);
                
                nameInput.value = '';
                messageInput.value = '';
                
                alert('Thank you for your message!');
            }
        });
    }
});

// Scroll animations for Justine & Nica intro
function setupScrollAnimations() {
    const introSection = document.querySelector('.jn-couple-intro');
    const quoteSection = document.querySelector('.jn-quote-section');
    if (!introSection || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const icon = entry.target.querySelector('.decorative-icon');
                const nameEl = entry.target.querySelector('.jn-couple-names');
                const dateEl = entry.target.querySelector('.jn-wedding-date');
                if (icon) icon.classList.add('visible');
                if (nameEl) nameEl.classList.add('visible');
                if (dateEl) dateEl.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.35 });

    observer.observe(introSection);

    if (quoteSection) {
        const quoteObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const heartGroup = entry.target.querySelector('.jn-quote-heart');
                    if (heartGroup) heartGroup.classList.add('draw');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });

        quoteObserver.observe(quoteSection);
    }
}

// Gentle downward drift for the top quote image while scrolling
function setupQuoteImageParallax() {
    const imageWrap = document.querySelector('.jn-quote-section-two-image img');
    if (!imageWrap) return;

    const scrollHost = document.querySelector('.right-side') || window;

    let ticking = false;

    const update = () => {
        const rect = imageWrap.getBoundingClientRect();
        const viewH = window.innerHeight || document.documentElement.clientHeight;
        // Start translating once the image begins entering (top near bottom of viewport)
        const enter = viewH;            // image top at viewport bottom
        const exit = viewH * 0.35;      // image well into viewport
        const raw = (enter - rect.top) / (enter - exit);
        const progress = Math.min(1, Math.max(0, raw));
        const maxShiftPx = rect.height * 0.25; // move up to 25% of its own height
        const translateY = progress * maxShiftPx;
        imageWrap.style.transform = `translateY(${translateY}px)`;
        imageWrap.style.opacity = 1;
        ticking = false;
    };

    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    };

    update();
    scrollHost.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
}

// Gentle upward drift for the bottom quote image while scrolling
function setupBottomQuoteImageParallax() {
    const imageWrap = document.querySelector('.jn-quote-section-two-image-bottom img');
    if (!imageWrap) return;

    const scrollHost = document.querySelector('.right-side') || window;

    let ticking = false;

    const update = () => {
        const rect = imageWrap.getBoundingClientRect();
        const viewH = window.innerHeight || document.documentElement.clientHeight;
        // Start translating once the image begins entering (top near bottom of viewport)
        const enter = viewH;            // image top at viewport bottom
        const exit = viewH * 0.35;      // image well into viewport
        const raw = (enter - rect.top) / (enter - exit);
        const progress = Math.min(1, Math.max(0, raw));
        const maxShiftPx = rect.height * 0.2; // move up to 20% of its own height
        const translateY = -progress * maxShiftPx; // negative for upward
        imageWrap.style.transform = `translateY(${translateY}px)`;
        imageWrap.style.opacity = 1;
        ticking = false;
    };

    const onScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    };

    update();
    scrollHost.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
}

// Slide-in animations for quote text and author
function setupQuoteTextSlides() {
    const section = document.querySelector('.jn-quote-section-two');
    const scrollHost = document.querySelector('.right-side');
    if (!section || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const texts = entry.target.querySelectorAll('.jn-quote-text-styled');
                const authors = entry.target.querySelectorAll('.jn-quote-author');
                const middle = entry.target.querySelector('.jn-quote-image-middle');
                texts.forEach(el => el.classList.add('is-visible'));
                authors.forEach(el => el.classList.add('is-visible'));
                if (middle) middle.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.3,
        root: scrollHost || null
    });

    observer.observe(section);
}

// Load More Comments
function loadMoreComments() {
    alert('More comments will be loaded here. This is a placeholder for the full comment list.');
}

// Add smooth scrolling for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Background music
window.addEventListener('load', function() {
    // Optional: Auto-play background music
    // const audio = new Audio('path-to-bruno-mars-marry-you.mp3');
    // audio.loop = true;
    // audio.play();
});
