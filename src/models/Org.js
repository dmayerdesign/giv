const mongoose = require('mongoose');

const orgSchema = new mongoose.Schema({
	name: {type: String, index: true},
	slug: {type: String, trim: true, unique: true},
	description: {type: String, index: true},
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

orgSchema.pre('save', function(next) {

});

const Org = mongoose.model('Org', orgSchema);

module.exports = Org;