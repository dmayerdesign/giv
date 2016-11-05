const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mongoose = require('mongoose');
// adminToken: h2u81eg7wr3h9uijk8

const donationSchema = new mongoose.Schema({
  id: String,
  org: String,
  orgName: String,
  dollars: Number,
  hours: Number,
  memo: String,
  verified: Boolean
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  emailIsVerified: Boolean,
  emailVerificationToken: String,
  password: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  facebook: String,
  tokens: Array,
  adminToken: String,
  permissions: [String],
  uniqueClicks: [String],
  starred: [String],
  favorites: [String],

  name: String,
  username: String,
  avatar: String,

  profile: {
    gender: String,
    location: String,
    website: String
  },

  interests: {},

  donations: [donationSchema]
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre('save', function(next) {
  const user = this;
  if (user.isNew || user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) { return next(err); }
      bcrypt.hash(user.password, salt, null, (err, hash) => {
        if (err) { return next(err); }
        user.password = hash;
        next();
      });
    });
  }
  else return next();
});

userSchema.pre('save', function(next) {
  if (this.isModified('interests')) {
    for (interest in this.interests) {
      if (this.interests[interest]) this.interests[interest] -= 0.01;
    }
  }
  next();
});

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    cb(err, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */
userSchema.methods.gravatar = function (size = 200) {
  if (!this.email) {
    return `https://gravatar.com/avatar/?s=${size}&d=retro`;
  }
  const md5 = crypto.createHash('md5').update(this.email).digest('hex');
  return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
