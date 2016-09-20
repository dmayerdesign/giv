const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
	authorId: {type: String},
	title: {type: String, index: true},
	content: {type: String, index: true},
	org: {type: String, index: true},
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;