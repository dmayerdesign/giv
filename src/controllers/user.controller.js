const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const User = require('../models/User');
const Org = require('../models/Org');

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password cannot be blank').notEmpty();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    return res.status(401).json({errmsg: "Login was not valid"});
  }

  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      res.status(401).json({errmsg: "Login was not valid"});
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      console.log(user);
      user.password = null;

      if (!user.emailIsVerified)
        res.json({errmsg: "You haven't verified this email address yet. Check your email!"});
      else
        res.json(user);
    });
  })(req, res, next);
};

/**
 * POST /verify-email
 */
exports.verifyEmail = (req, res, next) => {
  User.findOne({ emailVerificationToken: req.params.token }, (err, user) => {
    if (err) { 
      console.error(err);
      return res.json({ errmsg: 'Something went wrong' });
    }
    if (!user) {
      return res.json({ errmsg: 'Password reset token is invalid or has expired' });
    }
    user.emailIsVerified = true;
    user.save((err, user) => {
      if (err) { return res.json({ errmsg: 'Something went wrong' }); }
      res.json(user);
    });
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = (req, res, next) => {
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    res.status(500).json({errmsg: "Couldn't sign up"});
    return console.log(errors);
  }

  let token;
  crypto.randomBytes(16, (err, buf) => {
    token = buf.toString('hex');

    const user = new User({
      email: req.body.email,
      password: req.body.password,
      emailIsVerified: false,
      emailVerificationToken: token
    });

    User.findOne({ email: req.body.email }, (err, existingUser) => {
      if (err) { return res.json({errmsg: err}); }
      if (existingUser) {
        return res.json({errmsg: 'An account with that email address already exists.' });
      }
      user.save((err) => {
        if (err) { return res.json({errmsg: err}); }
        user.password = null;
        
        const transporter = nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: process.env.SENDGRID_USER,
            pass: process.env.SENDGRID_PASSWORD
          }
        });
        const mailOptions = {
          to: user.email,
          from: 'Giv Support <d.a.mayer92@gmail.com>',
          subject: 'Welcome to Giv!',
          html: `
            <!doctype html>
            <html><body>
              <h4>Thanks for joining Giv!</h4>
              <p>Click on the link below (or paste it into your browser) to finish the signup process:</p>
              <p><strong><a href='http://${req.headers.host}/verify-email/${token}' target='_blank'>Click here to verify your email</a></strong></p>
            </body></html>
          `
        };
        transporter.sendMail(mailOptions, (err) => {
          if (err) { return res.json({errmsg: err}); }
          res.status(200).json(user);
        });
      });
    });
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    return res.json({errmsg: "There were problems with your input"});
  }

  User.findById(req.body._id, (err, user) => {
    if (err) { return next(err); }
    user.email = req.body.email || '';
    user.name = req.body.name || '';
    user.avatar = req.body.avatar || '';
    user.username = req.body.username || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';
    user.save((err) => {
      if (err) {
        if (err.code === 11000) {
          return res.json({errmsg: 'The email address you have entered is already associated with an account.' });
        }
        res.json({errmsg: err});
        return next(err);
      }
      user.password = null;
      res.json(user);
    });
  });
};

exports.uploadUserAvatar = (req, res, next) => {
  let updateQuery = {$set:{}};
  updateQuery.$set.avatar = "https://d1poe49zt5yre3.cloudfront.net/" + req.newPath;
  //updateQuery.$set.avatar = "https://s3.amazonaws.com/fuse-uploads/" + req.newPath;
  User.findOneAndUpdate({_id: req.params.userId}, updateQuery, {new: true}, function(err, obj) {
    if(err) {
      console.log(err);
      res.send(400).json({errmsg: err});
    }
    else {
      console.log(obj.avatar);
      res.json(obj);
    } 
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = (req, res, next) => {
  req.assert('currentPassword', 'Password must be at least 4 characters long').len(4);
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.body._id, (err, user) => {
    if (err) { return next(err); }
    user.comparePassword(req.body.currentPassword, (err, isMatch) => {
      if (err) { res.json({ errmsg: "Password isn't valid" }); }
      if (isMatch) {
        user.password = req.body.password;
        user.save((err) => {
          if (err) { return next(err); }
          console.log(user);
          user.password = null;
          res.json(user);
          next();
        });
      }
      else {
        res.json({ errmsg: "Invalid email or password." });
        next();
      }
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = (req, res, next) => {
  User.remove({ _id: req.body._id }, (err) => {
    if (err) { return next(err); }
    res.json({ success: 'Your account has been deleted.' });
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = (req, res, next) => {
  const provider = req.params.provider;
  User.findById(req.body._id, (err, user) => {
    if (err) { return next(err); }
    user[provider] = undefined;
    user.tokens = user.tokens.filter(token => token.kind !== provider);
    user.save((err) => {
      if (err) { return next(err); }
      req.flash('info', { msg: `${provider} account has been unlinked.` });
      res.redirect('/account');
    });
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    return res.json({errmsg: errors});
  }

  async.waterfall([
    function (done) {
      crypto.randomBytes(16, (err, buf) => {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: req.body.email }, (err, user) => {
        if (err) { return done(err); }
        if (!user) {
          return res.json({ errmsg: 'Account with that email address does not exist.' });
        }
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 36000000; // 1 hour
        user.save((err) => {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'Giv Support <d.a.mayer92@gmail.com>',
        subject: 'Reset your password on Giv',
        text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };
      transporter.sendMail(mailOptions, (err) => {
        res.status(200).json({success: "An e-mail has been sent to " + user.email + " with further instructions." });
        done(err);
      });
    }
  ], (err) => {
    if (err) { return next(err); }
  });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirmPassword', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    return res.json({errmsg: errors});
  }

  async.waterfall([
    function (done) {
      User
        .findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now())
        .exec((err, user) => {
          if (err) { return next(err); }
          if (!user) {
            return res.json({ errmsg: 'Password reset token is invalid or has expired.' });
          }
          user.password = req.body.password;
          user.passwordResetToken = undefined;
          user.passwordResetExpires = undefined;
          user.save((err) => {
            if (err) { return next(err); }
            req.logIn(user, (err) => {
              done(err, user);
            });
          });
        });
    },
    function (user, done) {
      const transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
      const mailOptions = {
        to: user.email,
        from: 'd.a.mayer92@gmail.com',
        subject: 'Your Giv password has been changed',
        text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
      };
      transporter.sendMail(mailOptions, (err) => {
        done(err, user);
      });
    }
  ], (err, user) => {
    if (err) {
      console.log(err);
      res.json({errmsg: err});
      return next(err);
    }
    user.password = null;
    res.json(user);
    next(err, user);
  });
};

exports.getUser = (req, res) => {
  User.findOne({ _id: req.params.id }, (err, user) => {
    if (err) return console.log(err);
    if (user) {
      user.password = null;
      res.json(user);
    }
  });
};

exports.getUserByUsername = (req, res) => {
  User.findOne({ username: req.params.username }, (err, user) => {
    if (err) return console.log(err);
    if (user) {
      user.password = null;
      res.json(user);
    }
  });
};

exports.showInterest = (req, res) => {
  let userId = req.body.userId;
  let categories = req.body.categories;
  let increment = req.body.increment || 0;

  console.log("INTEREST REQUEST: ", userId, categories, increment);

  User.findOne({_id: userId}, (err, user) => {
    if(err) {
      res.json({errmsg: err});
      return console.log(err);
    }
    categories.forEach((category, index, arr) => {
      if (category.id === "other") {
        increment = 0.1;
      }
      if (!user.interests) {
        user.interests = {};
        user.interests[category.id] = 0;
      }
      if (user.interests[category.id]) {
        user.interests[category.id] += increment;
      }
      else user.interests[category.id] = increment;
    });
    
    console.log("INTERESTS: ", user.interests);

    user.markModified("interests");
    user.save((err, user) => {
      if(err) {
        res.status(500).json({errmsg: err});
        return console.log(err);
      }
      console.log(user);
      user.password = null;
      res.status(200).json(user);
    });
  });
};

exports.star = (req, res) => {
  let orgId = req.body.orgId;
  let userId = req.body.userId;
  let operator = function(action) {
    if (action === "add") return 1;
    if (action === "subtract") return -1;
    else return 0;
  }(req.params.action);

  let updateQuery = {$inc:{"stars": operator}};
  if (req.params.action === "add") updateQuery.$push = {"starredBy": req.body.userId};
  if (req.params.action === "subtract") updateQuery.$pull = {"starredBy": req.body.userId};
  
  Org.findOneAndUpdate({_id: orgId}, updateQuery, {new: true}, function(err, org) {
    if(err) {
      res.json({errmsg: err});
      return console.log(err);
    }
    if (!org) return res.json({errmsg: "Org lookup failed"});
    console.log(org);

    User.findOne({_id: userId}, (err, user) => {
      if(err) {
        res.json({errmsg: err});
        return console.log(err);
      }
      if (user.starred.indexOf(orgId) > -1) {
        if (operator == -1) {
          user.starred.splice(user.starred.indexOf(orgId), 1);
          org.categories.forEach((category, index, arr) => {
            if (!user.interests) {
              user.interests = {};
              user.interests[category.id] = 0;
            }
            if (user.interests && user.interests[category.id]) {
              if (category.id === "other") user.interests[category.id]-=0.2;
              else user.interests[category.id]-=5;
            }
          });
        }
      }
      else if (operator == 1) {
        user.starred.push(orgId);
        org.categories.forEach((category, index, arr) => {
          if (!user.interests) user.interests = {};
          if (user.interests[category.id]) {
              if (category.id === "other") user.interests[category.id]+=0.2;
              else user.interests[category.id]+=5;
            }
          else user.interests[category.id] = category.id === "other" ? 0.2 : 5;
        });
      }
      console.log("New interests: ", user.interests);

      user.markModified("interests");
      user.save((err, user) => {
        if(err) {
          res.status(500).json({errmsg: err});
          return console.log(err);
        }
        console.log(user);
        res.status(200).json({org: org, user: user});
      });
    });
  });
};

exports.adminToken = (req, res) => {
  if (process.env.ADMIN_TOKEN)
    res.status(200).json(process.env.ADMIN_TOKEN);
  else
    res.sendStatus(500);
};

exports.logDonation = (req, res) => {
  let orgId = req.body.orgId;
  let orgName = req.body.orgName;
  let userId = req.body.userId;
  let dollars = req.body.dollars || 0;
  let hours = req.body.hours || 0;
  let memo = req.body.memo || '';
  let verified = req.body.verified || false;

  if (!orgId || !userId) {
    console.log("User ID or org ID was not provided");
    res.json({errmsg: "User ID or org ID was not provided"});
    return;
  }

  let updateQuery = {
    $push: {
      donations: {
        dollars: dollars,
        hours: hours,
        memo: memo,
        verified: verified
      }
    }
  };

  let updateUser = updateQuery;
  let updateOrg = updateQuery;

  updateUser.$push.donations.org = orgId;
  updateUser.$push.donations.orgName = orgName;
  updateOrg.$push.donations.user = userId;
  
  Org.findOneAndUpdate({_id: orgId}, updateOrg, {new: true}, function(err, org) {
    if(err) {
      res.json({errmsg: err});
      return console.log(err);
    }
    if (!org) return res.json({errmsg: "Org lookup failed"});

    updateUser.$push.donations.id = org.donations[org.donations.length - 1]._id;

    User.findOneAndUpdate({_id: userId}, updateUser, {new: true}, function(err, user) {
      if(err) {
        res.json({errmsg: err});
        return console.log(err);
      }
      if (!user) return res.json({errmsg: "User lookup failed"});
      console.log(user);
      res.json(user);
    });
  });
};

exports.deleteDonation = (req, res) => {
  let donationId = req.params.id;
  let orgId = req.body.orgId;
  let userId = req.body.userId;

  if (!donationId || !orgId || !userId) {
    console.log("The correct data was not provided");
    console.log(req.body.orgId);
    console.log(req.body.userId);
    console.log(req.params.id);
    res.json({errmsg: "The correct data was not provided"});
    return;
  }

  let deleteFromUser = {
    $pull: {
      donations: {
        id: donationId
      }
    }
  };

  let deleteFromOrg = {
    $pull: {
      donations: {
        _id: donationId
      }
    }
  };
  
  Org.findOneAndUpdate({_id: orgId}, deleteFromOrg, {new: true}, function(err, org) {
    if(err) {
      res.json({errmsg: err});
      return console.log(err);
    }
    if (!org) return res.json({errmsg: "Org lookup failed"});
    console.log(org);

    User.findOneAndUpdate({_id: userId}, deleteFromUser, {new: true}, function(err, user) {
      if(err) {
        res.json({errmsg: err});
        return console.log(err);
      }
      if (!user) return res.json({errmsg: "User lookup failed"});
      console.log(user);
      res.json(user);
    });
  });
};
