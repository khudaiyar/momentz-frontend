const API_URL = "https://momentzz.onrender.com";


// Get authentication data
let token = localStorage.getItem('token');
let currentUserId = localStorage.getItem('userId');
let currentUsername = localStorage.getItem('username');

// Debug logging
console.log('=================================');
console.log('🔍 HOME.JS LOADED');
console.log('Token from localStorage:', token);
console.log('User ID:', currentUserId);
console.log('Username:', currentUsername);
console.log('=================================');

// Simple authentication check - NO redirect yet
if (!token) {
    console.log('⚠️ No token found, waiting 1 second...');
    // Wait a moment then check again
    setTimeout(() => {
        token = localStorage.getItem('token');
        currentUserId = localStorage.getItem('userId');
        currentUsername = localStorage.getItem('username');

        console.log('🔄 Second check - Token:', token);

        if (!token) {
            console.error('❌ Still no token, redirecting to login');
            window.location.href = '/index.html';
        } else {
            console.log('✅ Token found on second check!');
        }
    }, 1000);
}

// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('i');

// Load saved theme preference
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeIcon.className = 'fas fa-sun';
} else {
    body.classList.remove('dark-mode');
    themeIcon.className = 'fas fa-moon';
}

// Toggle theme
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
});

// API Helper
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        });

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/index.html';
            return null;
        }

        return response;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Show/Hide loading
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Show alert
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: ${type === 'error' ? '#ed4956' : '#0095f6'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideDown 0.3s ease-out;
    `;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Load current user profile
async function loadUserProfile() {
    try {
        const response = await apiCall('/users/me');
        if (!response) return;

        const user = await response.json();

        document.getElementById('sidebarUsername').textContent = user.username;
        document.getElementById('sidebarFullName').textContent = user.fullName || 'Welcome back!';

        const avatarUrl = user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=0095f6&color=fff&size=128`;
        document.getElementById('sidebarAvatar').src = avatarUrl;

        window.currentUserData = user;
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Load feed posts - Shows ALL posts from ALL users
async function loadFeed() {
    try {
        // Changed from /posts/feed to /posts/all to show everyone's posts
        const response = await apiCall('/posts/all?page=0&size=20');
        if (!response) return;

        const posts = await response.json();

        const feedContainer = document.getElementById('feedContainer');
        feedContainer.innerHTML = '';

        if (posts.length === 0) {
            feedContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 40px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: var(--shadow);">
                    <i class="fas fa-camera" style="font-size: 60px; color: var(--primary-accent); margin-bottom: 20px;"></i>
                    <h3 style="margin-bottom: 10px; color: var(--text-primary);">No posts yet</h3>
                    <p style="color: var(--text-secondary);">Be the first to share a moment!</p>
                    <button onclick="document.getElementById('createPostBtn').click()" style="margin-top: 20px; padding: 12px 30px; background: var(--primary-accent); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Create Post</button>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const postCard = createPostCard(post);
            feedContainer.appendChild(postCard);
        });
    } catch (error) {
        console.error('Error loading feed:', error);
        showAlert('Failed to load feed', 'error');
    }
}

// Create post card
function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.postId = post.id;

    const timeAgo = getTimeAgo(new Date(post.createdAt));
    const avatarUrl = post.userProfilePicture || `https://ui-avatars.com/api/?name=${post.username}&background=0095f6&color=fff&size=80`;

    card.innerHTML = `
        <div class="post-header">
            <img src="${avatarUrl}" alt="${post.username}" class="post-avatar">
            <span class="post-username" style="cursor: pointer;" onclick="window.location.href='/profile.html?user=${post.username}'">${post.username}</span>
            ${post.username === currentUsername ? `<button class="post-options" onclick="deletePost(${post.id})"><i class="fas fa-trash"></i></button>` : ''}
        </div>
        <img src="${post.imageUrl}" alt="Post" class="post-image" onclick="openPostDetail(${post.id})">
        <div class="post-actions">
            <div class="action-buttons">
                <button class="action-btn ${post.likedByCurrentUser ? 'liked' : ''}" onclick="toggleLike(${post.id}, this)">
                    <i class="${post.likedByCurrentUser ? 'fas' : 'far'} fa-heart"></i>
                </button>
                <button class="action-btn" onclick="openPostDetail(${post.id})">
                    <i class="far fa-comment"></i>
                </button>
                <button class="action-btn">
                    <i class="far fa-paper-plane"></i>
                </button>
            </div>
            <p class="likes-text">${post.likesCount} likes</p>
            ${post.caption ? `<p class="post-caption"><strong style="cursor: pointer;" onclick="window.location.href='/profile.html?user=${post.username}'">${post.username}</strong> ${post.caption}</p>` : ''}
            ${post.commentsCount > 0 ? `<p class="view-comments" onclick="openPostDetail(${post.id})">View all ${post.commentsCount} comments</p>` : ''}
            <p class="time-text">${timeAgo}</p>
        </div>
        <div class="add-comment">
            <input type="text" placeholder="Add a comment..." class="comment-input-${post.id}">
            <button class="post-btn" onclick="quickComment(${post.id})">Post</button>
        </div>
    `;

    return card;
}


// Toggle like
async function toggleLike(postId, button) {
    const icon = button.querySelector('i');
    const isLiked = button.classList.contains('liked');

    button.classList.toggle('liked');
    icon.className = isLiked ? 'far fa-heart' : 'fas fa-heart';

    const likesText = button.closest('.post-actions').querySelector('.likes-text');
    const currentLikes = parseInt(likesText.textContent);
    likesText.textContent = `${isLiked ? currentLikes - 1 : currentLikes + 1} likes`;

    try {
        if (isLiked) {
            await apiCall(`/likes/post/${postId}`, { method: 'DELETE' });
        } else {
            await apiCall(`/likes/post/${postId}`, { method: 'POST' });
            createFloatingHeart(button);
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        button.classList.toggle('liked');
        icon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
        likesText.textContent = `${currentLikes} likes`;
        showAlert('Failed to update like', 'error');
    }
}

// Quick comment
async function quickComment(postId) {
    const input = document.querySelector(`.comment-input-${postId}`);
    const content = input.value.trim();

    if (!content) return;

    try {
        await apiCall(`/comments/post/${postId}`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });

        input.value = '';
        showAlert('Comment posted!');
        loadFeed();
    } catch (error) {
        console.error('Error posting comment:', error);
        showAlert('Failed to post comment', 'error');
    }
}

// Delete post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    showLoading();
    try {
        await apiCall(`/posts/${postId}`, { method: 'DELETE' });
        showAlert('Post deleted successfully!');
        loadFeed();
    } catch (error) {
        console.error('Error deleting post:', error);
        showAlert('Failed to delete post', 'error');
    } finally {
        hideLoading();
    }
}

// Open post detail modal
async function openPostDetail(postId) {
    const modal = document.getElementById('postDetailModal');
    modal.style.display = 'block';

    showLoading();
    try {
        const response = await apiCall(`/posts/${postId}`);
        if (!response) return;

        const post = await response.json();

        const avatarUrl = post.userProfilePicture || `https://ui-avatars.com/api/?name=${post.username}&background=0095f6&color=fff&size=80`;

        document.getElementById('detailImage').src = post.imageUrl;
        document.getElementById('detailAvatar').src = avatarUrl;
        document.getElementById('detailAvatar2').src = avatarUrl;
        document.getElementById('detailUsername').textContent = post.username;
        document.getElementById('detailUsername2').textContent = post.username;
        document.getElementById('detailCaptionText').textContent = post.caption || '';
        document.getElementById('detailLikes').textContent = `${post.likesCount} likes`;
        document.getElementById('detailTime').textContent = getTimeAgo(new Date(post.createdAt));

        const deleteBtn = document.getElementById('detailDeleteBtn');
        if (post.username === currentUsername) {
            deleteBtn.style.display = 'block';
            deleteBtn.onclick = () => {
                modal.style.display = 'none';
                deletePost(postId);
            };
        } else {
            deleteBtn.style.display = 'none';
        }

        const likeBtn = document.getElementById('detailLikeBtn');
        const icon = likeBtn.querySelector('i');
        likeBtn.className = `action-btn ${post.likedByCurrentUser ? 'liked' : ''}`;
        icon.className = post.likedByCurrentUser ? 'fas fa-heart' : 'far fa-heart';
        likeBtn.onclick = () => toggleLike(postId, likeBtn);

        const commentsResponse = await apiCall(`/comments/post/${postId}`);
        if (!commentsResponse) return;

        const comments = await commentsResponse.json();

        const commentsList = document.getElementById('commentsContainer');
        commentsList.innerHTML = '';

        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment-item';
            const commentAvatar = comment.userProfilePicture || `https://ui-avatars.com/api/?name=${comment.username}&background=0095f6&color=fff&size=70`;
            commentDiv.innerHTML = `
                <img src="${commentAvatar}" alt="${comment.username}">
                <div class="comment-content">
                    <p><strong>${comment.username}</strong> ${comment.content}</p>
                    <p class="comment-time">${getTimeAgo(new Date(comment.createdAt))}</p>
                </div>
            `;
            commentsList.appendChild(commentDiv);
        });

        const commentInput = document.getElementById('commentInput');
        const postCommentBtn = document.getElementById('postCommentBtn');

        commentInput.value = '';
        postCommentBtn.onclick = async () => {
            const content = commentInput.value.trim();
            if (!content) return;

            try {
                await apiCall(`/comments/post/${postId}`, {
                    method: 'POST',
                    body: JSON.stringify({ content })
                });

                commentInput.value = '';
                showAlert('Comment posted!');
                openPostDetail(postId);
            } catch (error) {
                console.error('Error posting comment:', error);
                showAlert('Failed to post comment', 'error');
            }
        };

    } catch (error) {
        console.error('Error loading post details:', error);
        showAlert('Failed to load post details', 'error');
    } finally {
        hideLoading();
    }
}

// Create post modal handling
const createPostModal = document.getElementById('createPostModal');
const createPostBtn = document.getElementById('createPostBtn');
const selectImageBtn = document.getElementById('selectImageBtn');
const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImage');

let selectedImageData = null;

createPostBtn.addEventListener('click', () => {
    createPostModal.style.display = 'block';
    uploadArea.style.display = 'block';
    imagePreview.style.display = 'none';
    selectedImageData = null;
});

selectImageBtn.addEventListener('click', () => {
    imageInput.click();
});

uploadArea.addEventListener('click', (e) => {
    if (e.target !== selectImageBtn) {
        imageInput.click();
    }
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-accent)';
    uploadArea.style.background = 'var(--bg-secondary)';
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    uploadArea.style.background = '';

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageFile(file);
    }
});

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageFile(file);
    }
});

function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageData = e.target.result;
        previewImg.src = selectedImageData;
        uploadArea.style.display = 'none';
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

removeImageBtn.addEventListener('click', () => {
    selectedImageData = null;
    imageInput.value = '';
    uploadArea.style.display = 'block';
    imagePreview.style.display = 'none';
});

// Create post form submission - DEBUG VERSION
document.getElementById('createPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    console.log('🚀 === CREATE POST START ===');
    console.log('Token:', localStorage.getItem('token'));
    console.log('User ID:', localStorage.getItem('userId'));
    console.log('Username:', localStorage.getItem('username'));

    if (!selectedImageData) {
        showAlert('Please select an image', 'error');
        return;
    }

    const caption = document.getElementById('postCaption').value.trim();
    console.log('Caption:', caption);
    console.log('Image length:', selectedImageData.length);

    showLoading();

    try {
        console.log('📡 Calling API /posts...');

        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                imageUrl: selectedImageData,
                caption: caption
            })
        });

        console.log('📥 Response status:', response.status);
        console.log('📥 Response ok:', response.ok);

        if (response.status === 401) {
            console.error('❌ 401 UNAUTHORIZED - Token invalid or expired!');
            alert('Your session expired! Logging out...');
            localStorage.clear();
            window.location.href = '/index.html';
            return;
        }

        if (response.ok) {
            console.log('✅ Post created successfully!');
            const data = await response.json();
            console.log('Post data:', data);

            showAlert('Post created successfully!');
            createPostModal.style.display = 'none';
            document.getElementById('createPostForm').reset();
            uploadArea.style.display = 'block';
            imagePreview.style.display = 'none';
            selectedImageData = null;
            loadFeed();
        } else {
            console.error('❌ Post creation failed!');
            const errorText = await response.text();
            console.error('Error response:', errorText);
            showAlert(`Failed to create post (${response.status})`, 'error');
        }
    } catch (error) {
        console.error('💥 EXCEPTION:', error);
        showAlert('Network error! Check console.', 'error');
    } finally {
        hideLoading();
        console.log('🏁 === CREATE POST END ===');
    }
});

// Edit Profile Modal
const editProfileModal = document.getElementById('editProfileModal');
const editProfileBtn = document.getElementById('editProfileBtn');
const profileBtn = document.getElementById('profileBtn');

editProfileBtn.addEventListener('click', () => {
    if (window.currentUserData) {
        document.getElementById('editProfilePicture').value = window.currentUserData.profilePicture || '';
        document.getElementById('editFullName').value = window.currentUserData.fullName || '';
        document.getElementById('editBio').value = window.currentUserData.bio || '';
        document.getElementById('editWebsite').value = window.currentUserData.website || '';
    }
    editProfileModal.style.display = 'block';
});

profileBtn.addEventListener('click', () => {
    window.location.href = '/profile.html';
});

document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('editFullName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const website = document.getElementById('editWebsite').value.trim();
    const profilePicture = document.getElementById('editProfilePicture').value.trim();

    showLoading();

    try {
        const updateData = {
            fullName: fullName || null,
            bio: bio || null,
            website: website || null,
            profilePicture: profilePicture || null
        };

        const response = await apiCall('/users/update', {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (response && response.ok) {
            showAlert('Profile updated successfully!');
            editProfileModal.style.display = 'none';
            await loadUserProfile();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Failed to update profile', 'error');
    } finally {
        hideLoading();
    }
});

// Close modals
document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = '/index.html';
    }
});

// Load real user suggestions from database
async function loadSuggestions() {
    try {
        const response = await apiCall('/users/suggestions?limit=5');
        if (!response) return;

        const suggestions = await response.json();
        const container = document.getElementById('suggestionsContainer');
        container.innerHTML = '';

        if (suggestions.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: var(--text-secondary); padding: 20px; font-size: 14px;">
                    No suggestions yet. Invite your friends to join!
                </p>
            `;
            return;
        }

        suggestions.forEach(user => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            const avatar = user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=0095f6&color=fff&size=80`;
            div.innerHTML = `
                    <img src="${avatar}" alt="${user.username}">
                    <div class="suggestion-info">
                        <strong>${user.username}</strong>
                        <span>${user.fullName || 'New user'}</span>
                    </div>
                    <button class="follow-btn" onclick="followUser(${user.id}, this)">Follow</button>
                `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

// Follow user function - DEBUG VERSION
async function followUser(userId, button) {
    console.log('=== FOLLOW USER START ===');
    console.log('User ID to follow:', userId);
    console.log('Button:', button);
    console.log('Token:', localStorage.getItem('token'));

    try {
        console.log('Calling API: /users/follow/' + userId);

        const response = await apiCall(`/users/follow/${userId}`, {
            method: 'POST'
        });

        console.log('Response:', response);
        console.log('Response status:', response ? response.status : 'null');
        console.log('Response ok:', response ? response.ok : 'null');

        if (response && response.ok) {
            const data = await response.json();
            console.log('Success data:', data);

            button.textContent = 'Following';
            button.style.background = 'var(--bg-secondary)';
            button.style.color = 'var(--text-primary)';
            button.disabled = true;
            showAlert('Following!');
        } else {
            const errorData = await response.json();
            console.error('Error data:', errorData);
            showAlert(errorData.message || 'Failed to follow user', 'error');
        }
    } catch (error) {
        console.error('=== EXCEPTION ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        showAlert('Failed to follow user: ' + error.message, 'error');
    }

    console.log('=== FOLLOW USER END ===');
}

// Utility: Get time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return date.toLocaleDateString();
}

// Create floating heart animation
function createFloatingHeart(button) {
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.cssText = `
        position: fixed;
        font-size: 40px;
        pointer-events: none;
        z-index: 9999;
        animation: floatUp 1.5s ease-out forwards;
    `;

    const rect = button.getBoundingClientRect();
    heart.style.left = rect.left + rect.width / 2 + 'px';
    heart.style.top = rect.top + 'px';

    document.body.appendChild(heart);

    setTimeout(() => heart.remove(), 1500);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-100px) scale(1.5);
        }
    }

function handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        // Compress the image before storing
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;

            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.7 quality
            selectedImageData = canvas.toDataURL('image/jpeg', 0.7);
            previewImg.src = selectedImageData;
            uploadArea.style.display = 'none';
            imagePreview.style.display = 'block';

            console.log('✅ Image compressed! New size:', selectedImageData.length);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
    @keyframes slideDown {
        from {
            transform: translate(-50%, -20px);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            transform: translate(-50%, 0);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -20px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadFeed();
    loadSuggestions();
});