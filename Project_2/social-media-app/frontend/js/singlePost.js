document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('singlePostContainer');
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');
  const user = getUser();
  const token = getToken();

  if (!postId) {
    if(container) container.innerHTML = 'Post not found';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/posts`);
    const posts = await res.json();
    const post = posts.find(p => p.id == postId);

    if (!post) {
      if(container) container.innerHTML = '<p>Post not found</p>';
      return;
    }

    const commentsRes = await fetch(`${API_URL}/comments/${postId}`);
    const comments = await commentsRes.json();

    let commentsHtml = comments.map(c => `
      <div class="comment">
        ${renderAvatar(c.User)}
        <div class="comment-content">
          <h5 onclick="window.location.href='profile.html?id=${c.User.id}'" style="cursor:pointer">${c.User.username}</h5>
          <p>${c.text}</p>
        </div>
      </div>
    `).join('');

    let addCommentHtml = user ? `
      <form class="add-comment" id="commentForm">
        <input type="text" id="commentText" placeholder="Add a comment..." required>
        <button type="submit"><i class="fa-solid fa-paper-plane"></i></button>
      </form>
    ` : '<p style="margin-top:1rem; color:var(--text-muted); font-size:0.9rem;">Log in to comment.</p>';

    if(container) {
      container.innerHTML = `
        <div class="post-card">
          <div class="post-header" onclick="window.location.href='profile.html?id=${post.User.id}'" style="cursor:pointer">
            ${renderAvatar(post.User)}
            <div class="post-user-info">
              <h4>${post.User.username}</h4>
              <p>${new Date(post.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div class="post-content">${post.content}</div>
          ${post.image ? `<img src="/uploads/${post.image}" class="post-image">` : ''}
          <div class="post-actions">
            <button class="action-btn" onclick="likePost(${post.id}, this)">
              <i class="fa-solid fa-heart"></i> <span>${post.likesCount}</span>
            </button>
            ${user && post.User.id === user.id ? `
              <button class="action-btn" style="color: var(--danger-color);" onclick="deletePost(${post.id})">
                <i class="fa-solid fa-trash"></i> Delete
              </button>
            ` : ''}
          </div>
          
          <div class="comments-section">
            <h4 style="margin-bottom:1rem;">Comments</h4>
            <div id="commentsList">${commentsHtml || '<p style="color:var(--text-muted); font-size:0.9rem;">No comments yet.</p>'}</div>
            ${addCommentHtml}
          </div>
        </div>
      `;
    }

    if (user && container) {
      document.getElementById('commentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('commentText').value;
        try {
          const res = await fetch(`${API_URL}/comments/${postId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text })
          });
          if (res.ok) {
            window.location.reload();
          }
        } catch (err) {
          console.error(err);
        }
      });
    }
  } catch (err) {
    console.error(err);
  }

  window.deletePost = async function(postId) {
    console.log('Delete button clicked (single) for post:', postId);
    if (!confirm('Are you sure you want to delete this vibe?')) return;
    try {
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.href = 'index.html';
      } else {
        const data = await res.json();
        console.error('Delete error (single):', data);
        alert(data.error);
      }
    } catch (err) {
      console.error('Delete fetch error (single):', err);
    }
  };

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
        if (data.liked) btnElement.classList.add('liked');
        else btnElement.classList.remove('liked');
      }
    } catch (err) {
      console.error(err);
    }
  };
});
