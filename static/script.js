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

    // Setup RSVP functionality
    setupRSVP();

    // Setup payment modals
    setupPaymentModals();
});

// Setup payment modals
function setupPaymentModals() {
    const bankBtn = document.getElementById('bankTransferBtn');
    const gcashBtn = document.getElementById('gcashBtn');
    const bankModal = document.getElementById('bankTransferModal');
    const gcashModal = document.getElementById('gcashModal');

    if (bankBtn && bankModal) {
        bankBtn.addEventListener('click', function() {
            bankModal.classList.add('active');
        });

        bankModal.addEventListener('click', function(e) {
            if (e.target === bankModal) {
                closePaymentModal('bankTransferModal');
            }
        });
    }

    if (gcashBtn && gcashModal) {
        gcashBtn.addEventListener('click', function() {
            gcashModal.classList.add('active');
        });

        gcashModal.addEventListener('click', function(e) {
            if (e.target === gcashModal) {
                closePaymentModal('gcashModal');
            }
        });
    }
}

// Close payment modal
function closePaymentModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Setup RSVP functionality
function setupRSVP() {
    let selectedOption = null;
    const pathParts = window.location.pathname.split('/');
    const guestId = pathParts[pathParts.length - 1];
    
    const acceptBtn = document.querySelector('.rsvp-gifts-section .pill.blue');
    const declineBtn = document.querySelector('.rsvp-gifts-section .pill.cream');
    const submitBtn = document.querySelector('.rsvp-gifts-section .submit');
    const guestInput = document.querySelector('.rsvp-gifts-section input[type="number"]');
    
    if (!acceptBtn || !declineBtn || !submitBtn) return;
    
    // Check for existing RSVP on page load
    checkExistingRSVP();
    
    // Handle Accept button
    acceptBtn.addEventListener('click', function() {
        selectedOption = 'accept';
        acceptBtn.style.opacity = '1';
        acceptBtn.style.transform = 'scale(1.05)';
        declineBtn.style.opacity = '0.6';
        declineBtn.style.transform = 'scale(1)';
    });
    
    // Handle Decline button - submit immediately
    declineBtn.addEventListener('click', function() {
        selectedOption = 'decline';
        showRegretMessage();
    });
    
    // Handle Submit button
    submitBtn.addEventListener('click', function() {
        if (selectedOption === 'accept') {
            const guestCount = guestInput.value || 1;
            showThankYouMessage(guestCount);
        } else if (!selectedOption) {
            showModal('Reminder', 'Please select your presence option first.');
        }
    });
    
    // Show thank you message for acceptance
    function showThankYouMessage(guestCount) {
        // Submit RSVP to the new route
        console.log(guestId)
        const guestName = document.querySelector('.guest-name').textContent || 'Guest';
        
        fetch(`/${guestId}/rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                guest_name: guestName,
                response: 'accept',
                guest_count: parseInt(guestCount)
            })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    // console.log('Error data:', data.error);
                    // showModal('Error', data.error);
                    throw new Error(data.error || 'There was an error submitting your RSVP. Please try again.');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('RSVP submitted successfully:', data);
            // Show success message
            const rsvpSection = document.querySelector('.rsvp-gifts-section');
            rsvpSection.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; animation: fadeIn 0.5s ease;">
                    <h1 style="font-size: 48px; color: rgb(206, 227, 253); margin-bottom: 20px;">Thank You!</h1>
                    <p class="rsvp-gifts-subtitle" style="font-size: 24px; margin-bottom: 30px;">
                        We're thrilled you'll be joining us!<br>
                        Your confirmation for ${guestCount} guest(s) has been received.
                    </p>
                    <p class="rsvp-gifts-subtitle">
                        We can't wait to celebrate this special day with you.
                    </p>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error submitting RSVP:', error.message || error);
            showModal('Error', error.message);
        });
    }
    
    // Show regret message for decline
    function showRegretMessage() {
        // Submit RSVP to the new route
        const guestName = document.querySelector('.guest-name').textContent || 'Guest';
        
        fetch(`/${currentGuestId}/rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                guest_name: guestName,
                response: 'decline',
                guest_count: 0
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to submit RSVP');
            }
            return response.json();
        })
        .then(data => {
            console.log('RSVP decline submitted successfully:', data);
            // Show regret message
            const rsvpSection = document.querySelector('.rsvp-gifts-section');
            rsvpSection.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; animation: fadeIn 0.5s ease;">
                    <h1 style="font-size: 48px; color: rgb(206, 227, 253); margin-bottom: 20px;">We'll Miss You</h1>
                    <p class="rsvp-gifts-subtitle" style="font-size: 24px; margin-bottom: 30px;">
                        Thank you for letting us know.
                    </p>
                    <p class="rsvp-gifts-subtitle">
                        We're sorry you won't be able to join us,<br>
                        but we appreciate you taking the time to respond.
                    </p>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error submitting RSVP:', error);
            showModal('Error', 'There was an error submitting your RSVP. Please try again.');
        });
    }
}

// Check for existing RSVP
function checkExistingRSVP() {
    const pathParts = window.location.pathname.split('/');
    const guestId = pathParts[pathParts.length - 1]; 
    
    if (!guestId || guestId === 'invitation') {
        console.log('No guest ID found in URL');
        return;
    }
    
    currentGuestId = guestId;
    
    fetch(`/${guestId}/rsvp`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else if (response.status === 404) {
                // No existing RSVP, that's fine
                return null;
            } else {
                throw new Error('Failed to check RSVP status');
            }
        })
        .then(data => {
            if (data) {
                // Guest has already RSVP'd
                // console.log('Existing RSVP found:', data);
                const rsvpSection = document.querySelector('.rsvp-gifts-section');
                if (data.response === 'accept') {
                    rsvpSection.innerHTML = `
                        <div style="text-align: center; padding: 60px 20px; animation: fadeIn 0.5s ease;">
                            <h1 style="font-size: 48px; color: rgb(206, 227, 253); margin-bottom: 20px;">Thank You!</h1>
                            <p class="rsvp-gifts-subtitle" style="font-size: 24px; margin-bottom: 30px;">
                                Your RSVP has been received.<br>
                                We're thrilled you'll be joining us with ${data.guest_count} guest(s)!
                            </p>
                            <p class="rsvp-gifts-subtitle">
                                We can't wait to celebrate this special day with you.
                            </p>
                        </div>
                    `;
                } else if (data.response === 'decline') {
                    rsvpSection.innerHTML = `
                        <div style="text-align: center; padding: 60px 20px; animation: fadeIn 0.5s ease;">
                            <h1 style="font-size: 48px; color: rgb(206, 227, 253); margin-bottom: 20px;">RSVP Received</h1>
                            <p class="rsvp-gifts-subtitle" style="font-size: 24px; margin-bottom: 30px;">
                                Thank you for letting us know.
                            </p>
                            <p class="rsvp-gifts-subtitle">
                                We're sorry you won't be able to join us,<br>
                                but we appreciate you taking the time to respond.
                            </p>
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('Error checking RSVP:', error);
        });
}

// Show modal function
function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    
    if (modal && modalTitle && modalContent) {
        modalTitle.textContent = title;
        modalContent.textContent = content;
        modal.classList.add('active');
    }
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

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
            
            const source = document.createElement('source');
            source.src = 'https://res.cloudinary.com/drd1pnist/video/upload/v1767669594/JN-Teaser-Vid_bd3trr.mp4';
            source.type = 'video/mp4';
            video.appendChild(source);
            
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
                }).catch(e => console.error('Play failed:', e.message));
            });
            
            // Resume background music when video ends
            video.addEventListener('ended', function() {
                const bgMusic = document.getElementById('background-music');
                const musicBtn = document.querySelector('.music-control.playing');
                if (bgMusic && musicBtn) {
                    bgMusic.play();
                }
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
