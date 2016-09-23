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
 * Load environment variables either from .env file or Heroku config vars
 */
const env = process.env.ENV;
if (env !== "PRODUCTION") dotenv.load({ path: '.env' });

/**
 * AWS S3 uploads
 */
const AWS = require('aws-sdk'); AWS.config.region = 'us-west-2';
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = new AWS.S3({params: {Bucket: 'fuse-uploads', Key: 'default'}});

/**
* Security middleware
**/
const helmet = require('helmet');

/**
 * Controllers
 */
const userController = require('./controllers/user.controller');
const contactController = require('./controllers/contact.controller');
const orgController = require('./controllers/org.controller');
const postController = require('./controllers/post.controller');

/**
  * DANNY'S Services
  */
const search = require('./services/search');
const appService = require('./services/app.service');

/**
 * DANNY'S Models
 */
const User = require('./models/User');


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
// mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connection.config.autoIndex = true; // set to false to boost performance in production

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');
app.use(helmet());
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
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.post('/signup', userController.postSignup);
app.post('/contact-form', contactController.postContact);
app.get('/account', passportConfig.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);

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
mongoose.connection.on('error', () => {
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});
mongoose.connection.on('connected', () => {
  console.log('%s Connected to MongoDB', chalk.green('✓'));

  /**
  ** Orgs
  **/
  appService.applyRoutes(app, orgController.routes);

  /**
  ** Posts
  **/
  appService.applyRoutes(app, postController.routes);

  /**
  ** Users
  **/

  app.get('/user/:id', userController.getUser);


  // all other routes are handled by Angular
  app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
  });
















  var generateOrgs = false;
  if (generateOrgs) {
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

  var generateSomePosts = false;
  if (generateSomePosts) {
    for (let i = 0; i < 10; i++) {

      var lorem = i + "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?";
      var post = new Post({content: lorem, org: "57d3229c5e14ef284d0915ea"});
      post.save();
    }
  }

  // User.find({}, function(err, users) {
  //   console.log(users[0].password);
  //   bcrypt.compare('sohcahtoa', users[0].password, function(err, res) {
  //     console.log(res);
  //   });
  // });

  // var testdata = new User({
  //   name: "Danny",
  //   email: "d.a.mayer92@gmail.com",
  //   password: "sohcahtoa"
  // });
  // testdata.save(function(err, data){
  //     if(err) console.log(err);
  //     else console.log ('Sucess:' , data);
  // });
});




/** END fuse api **/

module.exports = app;
