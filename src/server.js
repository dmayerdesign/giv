/**
 * Module dependencies.
 */
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
//const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const sass = require('node-sass-middleware');
const bcrypt = require('bcrypt-nodejs');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env' });

/**
 * Controllers (route handlers).
 */
const homeController = require('./controllers/home');
const userController = require('./controllers/user');
const apiController = require('./controllers/api');
const contactController = require('./controllers/contact');

/**
  * DANNY'S Services
  */
const search = require('./services/search');

/**
 * DANNY'S Models
 */
const User = require('./models/User');
const Post = require('./models/Post');

/**
* DANNY'S Controllers
*/
const orgController = require('./controllers/org.controller');

/**
 * API keys and Passport configuration.
 */
const passportConfig = require('./config/passport');

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connection.config.autoIndex = true; // set to false to boost performance in production

// mongoose.connection.on('connected', () => {
//   console.log('%s MongoDB connection established!', chalk.green('✓'));
// });
// mongoose.connection.on('error', () => {
//   console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
//   process.exit();
// });

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');
app.use(compression());
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
    autoReconnect: true
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// app.use((req, res, next) => {
//   if (req.path === '/api/upload') {
//     next();
//   } else {
//     lusca.csrf()(req, res, next);
//   }
// });
//app.use(lusca.xframe('SAMEORIGIN'));
//app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
app.use(function(req, res, next) {
  // After successful login, redirect back to the intended page
  if (!req.user &&
      req.path !== '/login' &&
      req.path !== '/signup' &&
      !req.path.match(/^\/auth/) &&
      !req.path.match(/\./)) {
    req.session.returnTo = req.path;
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
/* For ng2 */
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(__dirname + '/../node_modules'));
app.use('/bundle', express.static(path.join(__dirname, 'bundle')));
app.use('/app', express.static(path.join(__dirname, 'app')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Primary app routes.
 */
app.get('/', homeController.index);
// app.get('/login', userController.getLogin);
// app.post('/login', userController.postLogin);
app.post('/login', userController.login);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
//app.get('/contact', contactController.getContact);
app.post('/contact-form', contactController.postContact);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

/**
 * API examples routes.
 */
app.get('/api', apiController.getApi);
app.get('/api/lastfm', apiController.getLastfm);
app.get('/api/nyt', apiController.getNewYorkTimes);
app.get('/api/aviary', apiController.getAviary);
app.get('/api/steam', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getSteam);
app.get('/api/stripe', apiController.getStripe);
app.post('/api/stripe', apiController.postStripe);
app.get('/api/scraping', apiController.getScraping);
app.get('/api/twilio', apiController.getTwilio);
app.post('/api/twilio', apiController.postTwilio);
app.get('/api/clockwork', apiController.getClockwork);
app.post('/api/clockwork', apiController.postClockwork);
app.get('/api/foursquare', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFoursquare);
app.get('/api/tumblr', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTumblr);
app.get('/api/facebook', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);
app.get('/api/github', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getGithub);
app.get('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getTwitter);
app.post('/api/twitter', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postTwitter);
app.get('/api/linkedin', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getLinkedin);
app.get('/api/instagram', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getInstagram);
app.get('/api/paypal', apiController.getPayPal);
app.get('/api/paypal/success', apiController.getPayPalSuccess);
app.get('/api/paypal/cancel', apiController.getPayPalCancel);
app.get('/api/lob', apiController.getLob);
//app.get('/api/upload', apiController.getFileUpload);
//app.post('/api/upload', upload.single('myFile'), apiController.postFileUpload);
app.get('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getPinterest);
app.post('/api/pinterest', passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.postPinterest);
app.get('/api/google-maps', apiController.getGoogleMaps);

/**
 * OAuth authentication routes. (Sign in)
 */
app.get('/auth/instagram', passport.authenticate('instagram'));
app.get('/auth/instagram/callback', passport.authenticate('instagram', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_location'] }), (req, res) => {
  console.log(req.user);
});
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/linkedin', passport.authenticate('linkedin', { state: 'SOME STATE' }));
app.get('/auth/linkedin/callback', passport.authenticate('linkedin', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});

/**
 * OAuth authorization routes. (API examples)
 */
app.get('/auth/foursquare', passport.authorize('foursquare'));
app.get('/auth/foursquare/callback', passport.authorize('foursquare', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/foursquare');
});
app.get('/auth/tumblr', passport.authorize('tumblr'));
app.get('/auth/tumblr/callback', passport.authorize('tumblr', { failureRedirect: '/api' }), (req, res) => {
  res.redirect('/api/tumblr');
});
app.get('/auth/steam', passport.authorize('openid', { state: 'SOME STATE' }));
app.get('/auth/steam/callback', passport.authorize('openid', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(req.session.returnTo || '/');
});
app.get('/auth/pinterest', passport.authorize('pinterest', { scope: 'read_public write_public' }));
app.get('/auth/pinterest/callback', passport.authorize('pinterest', { failureRedirect: '/login' }), (req, res) => {
  res.redirect('/api/pinterest');
});

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s Express server listening on port %d in %s mode.', chalk.green('✓'), app.get('port'), app.get('env'));
});


/** START fuse api **/

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');

    /**
    ** Orgs
    **
    ** Get the refactored orgs API from the orgController
    **/
    for (let i = 0; i < orgController.requests.length; i++) {
      let request = orgController.requests[i];
      if (request.middleware) {
        if (request.middleware.length === 1) app[request.method](request.uri, request.middleware[0], request.process);
        if (request.middleware.length === 2) app[request.method](request.uri, request.middleware[0], request.middleware[1], request.process);
        if (request.middleware.length > 2) app[request.method](request.uri, request.middleware[0], request.middleware[1], request.middleware[2], request.process);
      }
      else {
        app[request.method](request.uri, request.process);
      }
    }

    // get posts by org and search
    app.get('/posts/get', function(req, res) {
      var dbQuery = {};
      if (req.query.search) {
        dbQuery = search(req.query.search, req.query.field);
      }
      if (req.query.filterField) {
        dbQuery[req.query.filterField] = req.query.filterValue;
      }
      if (req.query.org) {
        dbQuery.org = req.query.org;

        Post.find(dbQuery, (err, docs) => {
          if(err) return console.error(err);
          res.json(docs);
        })
        .sort("-dateCreated")
        .skip(+req.query.offset)
        .limit(+req.query.limit);
      }
      else {
        console.log("Org needs to be specified to find posts");
      }
    });

    // count all
    app.get('/posts/count', function(req, res) {
      Post.count(function(err, count) {
        if(err) return console.error(err);
        res.json(count);
      });
    });

    // create
    app.post('/post', function(req, res) {
      var obj = new Post(req.body);
      obj.save(function(err, obj) {
        if(err) return console.error(err);
        res.status(200).json(obj);
      });
    });

    // find by id
    app.get('/post/:id', function(req, res) {
      Post.findOne({_id: req.params.id}, function (err, obj) {
        if(err) return console.error(err);
        res.json(obj);
      });
    });

    // update by id
    app.put('/post/:id', function(req, res) {
      Post.findOneAndUpdate({_id: req.params.id}, req.body, function (err) {
        if(err) return console.error(err);
        res.sendStatus(200);
      });
    });

    // delete by id
    app.delete('/post/:id', function(req, res) {
      Post.findOneAndRemove({_id: req.params.id}, function(err) {
        if(err) return console.error(err);
        res.sendStatus(200);
      });
    });

    
    var generateSomePosts = false;
    if (generateSomePosts) {
      for (let i = 0; i < 10; i++) {
        var lorem = i + "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?";
        var post = new Post({content: lorem, org: "57d3229c5e14ef284d0915ea"});
        post.save();
      }
    }


    /**
    ** Users
    **/

    app.get('/user/:id', userController.getUser);


    // all other routes are handled by Angular
    app.get('/*', function(req, res) {
      res.sendFile(__dirname + '/public/index.html');
    });
















    //generateOrgs();
    function generateOrgs() {
      let i = 0;
      while (i < 50) {
        orgController.sample(function(err, obj) {
          User.find({}, function(err, users) { // Give all users globalPermission
            users.forEach(function(user) {
              if (i = 0) {
                user.permissions = [];
              }
              user.permissions.push(obj.globalPermission);
              user.save();
            });
          });
        });
        i++;
      }
    }

    // User.find({}, function(err, users) {
    //   console.log(users[0].password);
    //   bcrypt.compare('test123', users[0].password, function(err, res) {
    //     console.log(res);
    //   });
    // });

    // var testdata = new User({
    //   name: "admin",
    //   password: "test123"
    // });
    // testdata.save(function(err, data){
    //     if(err) console.log(err);
    //     else console.log ('Sucess:' , data);
    // });
});




/** END fuse api **/

module.exports = app;
