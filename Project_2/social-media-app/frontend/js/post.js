document.addEventListener('DOMContentLoaded', () => {
  const feedContainer = document.getElementById('feedContainer');
  const createPostContainer = document.getElementById('createPostContainer');
  const user = getUser();
  const token = getToken();

  if (createPostContainer && user) {
    createPostContainer.innerHTML = `
      <div class="create-post-card">
        <form id="createPostForm">
          <textarea id="postContent" placeholder="What's your vibe today, ${user.username}?" required></textarea>
          <div class="create-post-actions">
            <div class="file-input-wrapper">
              <button type="button" class="btn btn-outline"><i class="fa-solid fa-image"></i> Image</button>
              <input type="file" id="postImage" accept="image/*">
            </div>
            <button type="submit" class="btn">Post</button>
          </div>
          <div id="imagePreview" style="margin-top: 10px; color: var(--text-muted); font-size: 0.9rem;"></div>
        </form>
      </div>
    `;

    document.getElementById('postImage').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('imagePreview').innerText = `Selected: ${file.name}`;
      }
    });

    document.getElementById('createPostForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = document.getElementById('postContent').value;
      const fileInput = document.getElementById('postImage');
      const formData = new FormData();
      formData.append('content', content);
      if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
      }

      try {
        const res = await fetch(`${API_URL}/posts`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          loadPosts();
          document.getElementById('postContent').value = '';
          fileInput.value = '';
          document.getElementById('imagePreview').innerText = '';
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  async function loadPosts() {
    if (!feedContainer) return;
    try {
      const res = await fetch(`${API_URL}/posts`);
      const posts = await res.json();
      
      if (posts.length === 0) {
        feedContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted);">No vibes yet. Be the first!</div>';
        return;
      }

      feedContainer.innerHTML = posts.map(post => `
        <div class="post-card">
          <div class="post-header" onclick="window.location.href='profile.html?id=${post.User.id}'" style="cursor:pointer">
            ${renderAvatar(post.User)}
            <div class="post-user-info">
              <h4>${post.User.username}</h4>
              <p>${new Date(post.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div class="post-content" onclick="window.location.href='post.html?id=${post.id}'" style="cursor:pointer">${post.content}</div>
          ${post.image ? `<img src="/uploads/${post.image}" class="post-image" onclick="window.location.href='post.html?id=${post.id}'" style="cursor:pointer">` : ''}
          <div class="post-actions">
            <button class="action-btn" onclick="likePost(${post.id}, this)">
              <i class="fa-solid fa-heart"></i> <span>${post.likesCount}</span>
            </button>
            <button class="action-btn" onclick="window.location.href='post.html?id=${post.id}'">
              <i class="fa-regular fa-comment"></i> Comment
            </button>
            ${user && post.User.id == user.id ? `
              <button class="action-btn" style="color: var(--danger-color);" onclick="deletePost(${post.id})">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    } catch (err) {
      feedContainer.innerHTML = '<div style="text-align: center; color: var(--danger-color);">Error loading vibes.</div>';
    }
  }

  window.likePost = async function(postId, btnElement) {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const countSpan = btnElement.querySelector('span');
        countSpan.innerText = data.likesCount;
        if (data.liked) {
          btnElement.classList.add('liked');
        } else {
          btnElement.classList.remove('liked');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.deletePost = async function(postId) {
    console.log('Delete button clicked for post:', postId);
    if (!confirm('Are you sure you want to delete this vibe?')) return;
    try {
      console.log('Sending delete request for post:', postId);
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Delete response status:', res.status);
      if (res.ok) {
        loadPosts();
      } else {
        const data = await res.json();
        console.error('Delete error data:', data);
        alert(data.error);
      }
    } catch (err) {
      console.error('Delete fetch error:', err);
    }
  };

  if (feedContainer) loadPosts();
});
