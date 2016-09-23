const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
	authorId: {type: String},
	title: {type: String, index: true},
	content: {type: String, index: true},
	images: [String],
	likes: Number,
	org: {type: String, index: true},
	dateCreated: {type: Date, default: Date.now()}
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;