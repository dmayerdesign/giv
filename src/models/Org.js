const mongoose = require('mongoose');

const orgSchema = new mongoose.Schema({
	name: {type: String, index: true},
	slug: {type: String, trim: true, unique: true},
	description: {type: String, index: true},
	creator: String,
	dateCreated: {type: Date, default: Date.now()},
	donateLink: String,
	website: String,
	facebook: String,
	stars: Number,
	starredBy: [String],
	featured: Boolean,

	verified: Boolean,
	official: Boolean,

	globalPermission: String, // for manager permission
	managers: [String],
	
	coverImage: String,
	gravatar: String,
	gallery: [String],
	posts: [String],
	categories: [String]
});

orgSchema.pre('save', function (next) {
  const org = this;
  let makeid = function makeid() {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-";
    for( var i=0; i < 10; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }
  if (org.isNew || org.isModified("name")) {
	  org.slug = org.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
  }
  if (org.isNew) {
  	org.globalPermission = makeid();
  }
	next();
});



const Org = mongoose.model('Org', orgSchema);

module.exports = Org;