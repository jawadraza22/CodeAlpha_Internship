const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Post;
