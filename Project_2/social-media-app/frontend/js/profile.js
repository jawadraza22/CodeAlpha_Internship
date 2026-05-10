document.addEventListener('DOMContentLoaded', async () => {
  const profileHeader = document.getElementById('profileHeader');
  const userPosts = document.getElementById('userPosts');
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = urlParams.get('id');
  const currentUser = getUser();
  const token = getToken();

  if (!profileId) {
    if(profileHeader) profileHeader.innerHTML = 'Profile not found';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/users/${profileId}`);
    const profileUser = await res.json();

    if (!res.ok) {
      if(profileHeader) profileHeader.innerHTML = '<p>User not found</p>';
      return;
    }

    let actionBtnHtml = '';
    if (currentUser) {
      if (currentUser.id == profileId) {
        actionBtnHtml = `<button class="btn btn-outline" onclick="toggleEditProfile()" style="margin-top: 1rem;">
          Edit Profile
        </button>`;
      } else {
        const followRes = await fetch(`${API_URL}/follows/${profileId}/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const followData = await followRes.json();
        
        const isFollowing = followData.following;
        actionBtnHtml = `<button class="btn ${isFollowing ? 'btn-outline' : ''}" onclick="toggleFollow(${profileId}, this)" style="margin-top: 1rem;">
          ${isFollowing ? 'Unfollow' : 'Follow'}
        </button>`;
      }
    }

    if(profileHeader) {
      profileHeader.innerHTML = `
        <div class="profile-header">
          ${renderAvatar(profileUser).replace('avatar', 'profile-avatar')}
          <h2>${profileUser.username}</h2>
          <p style="color: var(--text-muted);">${profileUser.email}</p>
          <div class="profile-stats">
            <div class="stat-item">
              <span>${profileUser.followersCount || 0}</span>
              <p>Followers</p>
            </div>
            <div class="stat-item">
              <span>${profileUser.followingCount || 0}</span>
              <p>Following</p>
            </div>
          </div>
          <p style="margin-top: 1rem;">${profileUser.bio || 'No bio yet.'}</p>
          ${actionBtnHtml}
        </div>
      `;

      // Fill edit form
      if (currentUser && currentUser.id == profileId) {
        document.getElementById('editUsername').value = profileUser.username;
        document.getElementById('editBio').value = profileUser.bio || '';
      }
    }

    // Load user posts
    const postsRes = await fetch(`${API_URL}/posts/user/${profileId}`);
    const posts = await postsRes.json();

    if(userPosts) {
      if (posts.length === 0) {
        userPosts.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No vibes yet.</p>';
      } else {
        userPosts.innerHTML = posts.map(post => `
          <div class="post-card">
            <div class="post-header">
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
            </div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error(err);
  }

  window.toggleFollow = async function(id, btnElement) {
    try {
      const res = await fetch(`${API_URL}/follows/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.following) {
          btnElement.innerText = 'Unfollow';
          btnElement.classList.add('btn-outline');
        } else {
          btnElement.innerText = 'Follow';
          btnElement.classList.remove('btn-outline');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.toggleEditProfile = function() {
    const container = document.getElementById('editProfileContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  };

  if (document.getElementById('editProfileForm')) {
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('editUsername').value;
      const bio = document.getElementById('editBio').value;
      const avatarFile = document.getElementById('editAvatar').files[0];

      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);

      try {
        const res = await fetch(`${API_URL}/users/update`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          // Update local user data
          const user = getUser();
          user.username = data.user.username;
          user.avatar = data.user.avatar;
          localStorage.setItem('user', JSON.stringify(user));
          window.location.reload();
        } else {
          alert(data.error);
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  window.deletePost = async function(postId) {
    console.log('Delete button clicked (profile) for post:', postId);
    if (!confirm('Are you sure you want to delete this vibe?')) return;
    try {
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        console.error('Delete error (profile):', data);
        alert(data.error);
      }
    } catch (err) {
      console.error('Delete fetch error (profile):', err);
    }
  };

  window.likePost = async function(postId, btnElement) {
    if (!currentUser) {
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
        if (data.liked) btnElement.classList.add('liked');
        else btnElement.classList.remove('liked');
      }
    } catch (err) {
      console.error(err);
    }
  };
});
