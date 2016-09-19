const mongoose = require('mongoose');

const orgSchema = new mongoose.Schema({
	name: String,
	slug: {type: String, unique: true},
	description: String,
	dateCreated: {type: Date, default: Date.now()},
	donateLink: String,
	website: String,
	facebook: String,
	stars: Number,
	verified: Boolean,
	
	coverImage: String,
	gravatar: String,
	gallery: [String]
});

const Org = mongoose.model('Org', orgSchema);

module.exports = Org;