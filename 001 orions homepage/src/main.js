// Main application entry point
console.log('Frontend project loaded!');

// Photo Gallery State
let photos = JSON.parse(localStorage.getItem('orionPhotos')) || [];
let currentPhotoId = null;
let photoQueue = [];
let currentQueueIndex = 0;

// DOM manipulation
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    if (app) {
        console.log('App initialized');
    }
    
    initPhotoGallery();
});

function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set max dimensions
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            
            let width = img.width;
            let height = img.height;
            
            // Calculate new dimensions
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
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed data URL (0.7 quality)
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedDataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function initPhotoGallery() {
    const addPhotoBtn = document.getElementById('addPhotoBtn');
    const photoInput = document.getElementById('photoInput');
    const modal = document.getElementById('ratingModal');
    const closeBtn = document.querySelector('.close');
    const saveRatingBtn = document.getElementById('saveRatingBtn');
    const cutenessSlider = document.getElementById('cutenessSlider');
    const ratingValue = document.getElementById('ratingValue');
    
    // Add photo button click
    addPhotoBtn.addEventListener('click', () => {
        photoInput.click();
    });
    
    // Handle photo selection
    photoInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            photoQueue = new Array(files.length);
            currentQueueIndex = 0;
            
            // Read all files and add to queue
            let filesProcessed = 0;
            files.forEach((file, index) => {
                compressImage(file, (compressedDataUrl) => {
                    photoQueue[index] = {
                        id: Date.now() + index * 100,
                        src: compressedDataUrl
                    };
                    filesProcessed++;
                    
                    // Once all files are read, show the first one
                    if (filesProcessed === files.length) {
                        showPhotoInModal(0);
                    }
                });
            });
        }
    });
    
    // Update rating value display
    cutenessSlider.addEventListener('input', (e) => {
        ratingValue.textContent = e.target.value;
    });
    
    // Save rating
    saveRatingBtn.addEventListener('click', () => {
        if (photoQueue.length === 0 || currentQueueIndex >= photoQueue.length) {
            modal.style.display = 'none';
            return;
        }
        
        const currentPhoto = photoQueue[currentQueueIndex];
        if (!currentPhoto) {
            return;
        }
        
        const rating = parseInt(document.getElementById('cutenessSlider').value);
        const tagsInput = document.getElementById('tagInput').value;
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        
        const photoData = {
            id: currentPhoto.id,
            src: currentPhoto.src,
            rating: rating,
            tags: tags
        };
        
        photos.push(photoData);
        savePhotos();
        renderGallery();
        
        // Check if there are more photos in the queue
        currentQueueIndex++;
        if (currentQueueIndex < photoQueue.length) {
            showPhotoInModal(currentQueueIndex);
        } else {
            // All photos rated, close modal and reset
            modal.style.display = 'none';
            photoInput.value = '';
            photoQueue = [];
            currentQueueIndex = 0;
        }
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        photoQueue = [];
        currentQueueIndex = 0;
        photoInput.value = '';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            photoQueue = [];
            currentQueueIndex = 0;
            photoInput.value = '';
        }
    });
    
    // Initial render
    renderGallery();
}

function showPhotoInModal(index) {
    const modal = document.getElementById('ratingModal');
    const modalImage = document.getElementById('modalImage');
    const cutenessSlider = document.getElementById('cutenessSlider');
    const ratingValue = document.getElementById('ratingValue');
    const tagInput = document.getElementById('tagInput');
    const modalTitle = document.querySelector('.modal-content h3');
    
    currentPhotoId = photoQueue[index].id;
    modalImage.src = photoQueue[index].src;
    cutenessSlider.value = 5;
    ratingValue.textContent = 5;
    tagInput.value = '';
    
    // Update title to show progress
    if (photoQueue.length > 1) {
        modalTitle.textContent = `Rate This Photo (${index + 1} of ${photoQueue.length})`;
    } else {
        modalTitle.textContent = 'Rate This Photo';
    }
    
    modal.style.display = 'block';
}

function renderGallery() {
    const gallery = document.getElementById('photoGallery');
    gallery.innerHTML = '';
    
    if (photos.length === 0) {
        gallery.innerHTML = '<p class="empty-gallery">No photos yet! Add your first photo of Orion.</p>';
        return;
    }
    
    photos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        
        const cutenessLevel = getCutenessLabel(photo.rating);
        
        photoCard.innerHTML = `
            <img src="${photo.src}" alt="Orion photo">
            <div class="photo-info">
                <div class="rating-badge ${cutenessLevel.class}">
                    ${cutenessLevel.emoji} ${cutenessLevel.label} (${photo.rating}/10)
                </div>
                ${photo.tags.length > 0 ? `
                    <div class="tags">
                        ${photo.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                <button class="btn-small btn-delete" data-id="${photo.id}">Delete</button>
            </div>
        `;
        
        // Add delete functionality
        photoCard.querySelector('.btn-delete').addEventListener('click', () => {
            deletePhoto(photo.id);
        });
        
        gallery.appendChild(photoCard);
    });
}

function getCutenessLabel(rating) {
    if (rating <= 3) {
        return { label: 'Very Lumpy', emoji: '😴', class: 'lumpy' };
    } else if (rating <= 5) {
        return { label: 'Kinda Lumpy', emoji: '😐', class: 'medium-lumpy' };
    } else if (rating <= 7) {
        return { label: 'Getting Cute', emoji: '😊', class: 'medium-cute' };
    } else if (rating <= 9) {
        return { label: 'Very Cute', emoji: '😸', class: 'cute' };
    } else {
        return { label: 'Maximum Cuteness', emoji: '😻', class: 'super-cute' };
    }
}

function deletePhoto(id) {
    if (confirm('Are you sure you want to delete this photo?')) {
        photos = photos.filter(photo => photo.id !== id);
        savePhotos();
        renderGallery();
    }
}

function savePhotos() {
    localStorage.setItem('orionPhotos', JSON.stringify(photos));
}



