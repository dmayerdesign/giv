const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
	authorId: {type: String},
	title: {type: String, index: true},
	content: {type: String},
	featuredImage: String,
	likes: Number,
	org: {type: String, index: true},
	imageBucket: String
},
{
	timestamps: true
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;