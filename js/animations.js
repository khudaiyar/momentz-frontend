// Create falling stickers animation
function createFallingStickers() {
    const container = document.querySelector('.falling-stickers');
    if (!container) {
        console.log('No falling-stickers container found');
        return;
    }

    const stickers = ['❤️', '👍', '💬', '📷', '⭐', '✨', '🎉', '💝', '🔥', '😍', '💕', '🌟'];
    const stickerCount = 20;

    // Clear existing stickers
    container.innerHTML = '';

    for (let i = 0; i < stickerCount; i++) {
        const sticker = document.createElement('div');
        sticker.className = 'sticker';
        sticker.textContent = stickers[Math.floor(Math.random() * stickers.length)];

        // Random position
        sticker.style.left = Math.random() * 100 + '%';

        // Random animation duration (slower = more visible)
        const duration = (Math.random() * 5 + 8) + 's';
        sticker.style.animationDuration = duration;

        // Random delay
        sticker.style.animationDelay = (Math.random() * 5) + 's';

        container.appendChild(sticker);
    }

    console.log(`Created ${stickerCount} falling stickers`);
}

// Change main photo slideshow
const yourPhotos = [
    '/images/photo1.jpg',
    '/images/photo2.jpg',
    '/images/photo3.jpg'
];

let currentPhotoIndex = 0;

function startPhotoSlideshow() {
    const img = document.getElementById('mainPhoto');
    if (!img) {
        console.log('No mainPhoto element found');
        return;
    }

    // Only rotate if we have multiple photos
    if (yourPhotos.length <= 1) {
        console.log('Only one photo, no slideshow needed');
        return;
    }

    setInterval(() => {
        img.style.opacity = '0';

        setTimeout(() => {
            currentPhotoIndex = (currentPhotoIndex + 1) % yourPhotos.length;
            img.src = yourPhotos[currentPhotoIndex];
            img.style.opacity = '1';
        }, 500);
    }, 4000);

    console.log('Photo slideshow started');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting animations');
    createFallingStickers();
    startPhotoSlideshow();
});

// Also try to initialize immediately
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting...');
} else {
    console.log('Document already loaded, initializing now');
    createFallingStickers();
    startPhotoSlideshow();
}