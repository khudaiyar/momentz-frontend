const API_URL = "https://momentzz.onrender.com/api";
const token = localStorage.getItem('token');
const currentUserId = localStorage.getItem('userId');
const currentUsername = localStorage.getItem('username');

// Check authentication
if (!token) {
    window.location.href = '/index.html';
}

// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
const themeSettingBtn = document.getElementById('themeSettingBtn');
const body = document.body;
const themeIcon = themeToggle.querySelector('i');

// Load saved theme preference
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeIcon.className = 'fas fa-sun';
    if (themeSettingBtn) {
        themeSettingBtn.querySelector('i').className = 'fas fa-sun';
        themeSettingBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
} else {
    body.classList.remove('dark-mode');
    themeIcon.className = 'fas fa-moon';
    if (themeSettingBtn) {
        themeSettingBtn.querySelector('i').className = 'fas fa-moon';
        themeSettingBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
}

// Toggle theme function
function toggleTheme() {
    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
        if (themeSettingBtn) {
            themeSettingBtn.querySelector('i').className = 'fas fa-sun';
            themeSettingBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        }
    } else {
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
        if (themeSettingBtn) {
            themeSettingBtn.querySelector('i').className = 'fas fa-moon';
            themeSettingBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
    }
}

// Theme toggle button click
themeToggle.addEventListener('click', toggleTheme);

// Theme setting button click (in settings modal)
if (themeSettingBtn) {
    themeSettingBtn.addEventListener('click', toggleTheme);
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

// API Helper - Fixed to not redirect on all errors
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

        // Only redirect on 401 Unauthorized
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

// Load profile data
async function loadProfile() {
    showLoading();
    try {
        const response = await apiCall('/users/me');
        if (!response) return;

        const user = await response.json();

        console.log('User profile loaded:', user);

        // Store for later use
        window.currentUserData = user;

        // Update profile picture
        const profilePic = user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=0095f6&color=fff&size=150`;
        document.getElementById('profilePicture').src = profilePic;

        // Update profile info
        document.getElementById('profileUsername').textContent = user.username;
        document.getElementById('profileFullName').textContent = user.fullName || user.username;
        document.getElementById('profileBio').textContent = user.bio || 'No bio yet';

        // Update website
        if (user.website) {
            const websiteLink = document.getElementById('profileWebsite');
            websiteLink.href = user.website;
            websiteLink.style.display = 'inline-flex';
            document.getElementById('websiteText').textContent = user.website;
        } else {
            document.getElementById('profileWebsite').style.display = 'none';
        }

        // Update stats
        document.getElementById('postsCount').textContent = user.postsCount || 0;
        document.getElementById('followersCount').textContent = user.followersCount || 0;
        document.getElementById('followingCount').textContent = user.followingCount || 0;

        // Load user posts
        await loadUserPosts(user.username);

    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile', 'error');
    } finally {
        hideLoading();
    }
}

// Load user posts
async function loadUserPosts(username) {
    try {
        const response = await apiCall(`/posts/user/${username}`);
        if (!response) return;

        const posts = await response.json();

        console.log('User posts loaded:', posts);

        const grid = document.getElementById('profilePostsGrid');
        grid.innerHTML = '';

        if (posts.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-camera"></i>
                    <h3>No Posts Yet</h3>
                    <p>When you share photos and videos, they will appear on your profile.</p>
                    <button onclick="document.getElementById('createPostBtn').click()">
                        <i class="fas fa-plus"></i> Share Your First Post
                    </button>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const postItem = document.createElement('div');
            postItem.className = 'post-grid-item';
            postItem.innerHTML = `
                <img src="${post.imageUrl}" alt="Post">
                <div class="post-grid-overlay">
                    <div class="post-stat">
                        <i class="fas fa-heart"></i>
                        <span>${post.likesCount}</span>
                    </div>
                    <div class="post-stat">
                        <i class="fas fa-comment"></i>
                        <span>${post.commentsCount}</span>
                    </div>
                </div>
            `;
            postItem.onclick = () => window.location.href = `/home.html?post=${post.id}`;
            grid.appendChild(postItem);
        });

    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Profile Picture Upload Handler
let selectedProfilePicture = null;
const profilePictureInput = document.createElement('input');
profilePictureInput.type = 'file';
profilePictureInput.accept = 'image/*';
profilePictureInput.style.display = 'none';
document.body.appendChild(profilePictureInput);

profilePictureInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            selectedProfilePicture = event.target.result;
            // Update preview immediately
            document.getElementById('profilePicture').src = selectedProfilePicture;
            showAlert('Profile picture selected! Click "Save Changes" in Edit Profile to update.');
            // Open edit modal
            editProfileBtn.click();
        };
        reader.readAsDataURL(file);
    }
});

// Edit Profile Modal
const editProfileModal = document.getElementById('editProfileModal');
const editProfileBtn = document.getElementById('editProfileBtn');
const changePhotoBtn = document.getElementById('changePhotoBtn');

editProfileBtn.addEventListener('click', () => {
    if (window.currentUserData) {
        document.getElementById('editUsername').value = window.currentUserData.username;
        document.getElementById('editEmail').value = window.currentUserData.email;

        // Reset profile picture input
        if (selectedProfilePicture) {
            document.getElementById('editProfilePicture').value = 'Image uploaded from device';
            document.getElementById('editProfilePicture').disabled = true;
            const previewDiv = document.getElementById('profilePicturePreview');
            if (previewDiv) {
                previewDiv.querySelector('img').src = selectedProfilePicture;
                previewDiv.style.display = 'block';
            }
        } else {
            document.getElementById('editProfilePicture').value = window.currentUserData.profilePicture || '';
            document.getElementById('editProfilePicture').disabled = false;
            const previewDiv = document.getElementById('profilePicturePreview');
            if (previewDiv) {
                previewDiv.style.display = 'none';
            }
        }

        document.getElementById('editFullName').value = window.currentUserData.fullName || '';
        document.getElementById('editBio').value = window.currentUserData.bio || '';
        document.getElementById('editWebsite').value = window.currentUserData.website || '';
        updateBioCharCount();
    }
    editProfileModal.style.display = 'block';
});

// Change photo button - Opens file picker
changePhotoBtn.addEventListener('click', () => {
    profilePictureInput.click();
});

// NEW: Upload from device button in edit modal
const uploadFromDeviceBtn = document.getElementById('uploadFromDevice');
if (uploadFromDeviceBtn) {
    uploadFromDeviceBtn.addEventListener('click', () => {
        profilePictureInput.click();
    });
}

// Update the file input handler to show preview
profilePictureInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('Image too large! Please choose an image under 5MB', 'error');
            return;
        }

        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            showAlert('Please select an image file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            // Compress the image
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;

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

                // Compress to JPEG
                selectedProfilePicture = canvas.toDataURL('image/jpeg', 0.8);

                // Update preview in modal
                const previewDiv = document.getElementById('profilePicturePreview');
                if (previewDiv) {
                    const previewImg = previewDiv.querySelector('img');
                    previewImg.src = selectedProfilePicture;
                    previewDiv.style.display = 'block';
                }

                // Update main profile picture preview
                document.getElementById('profilePicture').src = selectedProfilePicture;

                // Clear the URL input
                document.getElementById('editProfilePicture').value = 'Image uploaded from device';
                document.getElementById('editProfilePicture').disabled = true;

                showAlert('Image uploaded! Click "Save Changes" to update your profile.');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Bio character count
const bioTextarea = document.getElementById('editBio');
const charCount = document.getElementById('bioCharCount');

function updateBioCharCount() {
    const count = bioTextarea.value.length;
    charCount.textContent = count;
    if (count > 450) {
        charCount.style.color = '#ed4956';
    } else {
        charCount.style.color = 'var(--text-secondary)';
    }
}

bioTextarea.addEventListener('input', updateBioCharCount);

// Edit Profile Form Submission - Fixed
document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('editFullName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const website = document.getElementById('editWebsite').value.trim();

    // Use selected profile picture if available, otherwise use URL input
    let profilePictureToSend = selectedProfilePicture;
    if (!profilePictureToSend) {
        const profilePictureUrl = document.getElementById('editProfilePicture').value.trim();
        if (profilePictureUrl && profilePictureUrl !== 'Image selected from computer') {
            if (!isValidUrl(profilePictureUrl)) {
                showAlert('Please enter a valid profile picture URL', 'error');
                return;
            }
            profilePictureToSend = profilePictureUrl;
        }
    }

    // Validate website URL if provided
    if (website && !isValidUrl(website)) {
        showAlert('Please enter a valid website URL', 'error');
        return;
    }

    showLoading();

    try {
        const updateData = {
            fullName: fullName || null,
            bio: bio || null,
            website: website || null
        };

        // Only include profile picture if one was selected/provided
        if (profilePictureToSend) {
            updateData.profilePicture = profilePictureToSend;
        }

        console.log('Updating profile with data:', updateData);

        const response = await apiCall(`/users/update`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });

        if (!response) {
            hideLoading();
            return;
        }

        if (response.ok) {
            showAlert('Profile updated successfully!');
            editProfileModal.style.display = 'none';
            selectedProfilePicture = null; // Reset selected picture
            document.getElementById('editProfilePicture').disabled = false;
            await loadProfile(); // Reload profile
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Failed to update profile. Please try again.', 'error');
    } finally {
        hideLoading();
    }
});

// Validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Settings Modal
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');

settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'block';
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = '/index.html';
    }
});

// Create Post Modal
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
    document.getElementById('postCaption').value = '';
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

    console.log('🚀 === CREATE POST START (PROFILE) ===');
    console.log('Token:', localStorage.getItem('token'));
    console.log('User ID:', localStorage.getItem('userId'));
    console.log('Username:', localStorage.getItem('username'));

    if (!selectedImageData) {
        showAlert('Please select an image', 'error');
        return;
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
            await loadProfile();
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

// Profile tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        const tab = this.dataset.tab;
        if (tab === 'posts') {
            loadUserPosts(currentUsername);
        } else if (tab === 'saved') {
            document.getElementById('profilePostsGrid').innerHTML = `
                <div class="empty-state">
                    <i class="far fa-bookmark"></i>
                    <h3>Save</h3>
                    <p>Save photos and videos that you want to see again.</p>
                </div>
            `;
        } else if (tab === 'tagged') {
            document.getElementById('profilePostsGrid').innerHTML = `
                <div class="empty-state">
                    <i class="far fa-user"></i>
                    <h3>Photos of You</h3>
                    <p>When people tag you in photos, they'll appear here.</p>
                </div>
            `;
        }
    });
});

// Add animations CSS
const style = document.createElement('style');
style.textContent = `
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
    loadProfile();
});