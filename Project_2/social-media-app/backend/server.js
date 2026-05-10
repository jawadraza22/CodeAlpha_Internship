require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/db');

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Follow = require('./models/Follow');

// Relationships
User.hasMany(Post, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });
Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

User.belongsToMany(User, { as: 'Followers', through: Follow, foreignKey: 'followingId', otherKey: 'followerId' });
User.belongsToMany(User, { as: 'Following', through: Follow, foreignKey: 'followerId', otherKey: 'followingId' });

User.belongsToMany(Post, { through: 'Likes', as: 'LikedPosts', foreignKey: 'userId', otherKey: 'postId', onDelete: 'CASCADE' });
Post.belongsToMany(User, { through: 'Likes', as: 'Likers', foreignKey: 'postId', otherKey: 'userId', onDelete: 'CASCADE' });

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/follows', require('./routes/followRoutes'));

const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => {
  console.log('Database synced');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend available at http://localhost:${PORT}`);
  });
}).catch(err => console.log(err));
