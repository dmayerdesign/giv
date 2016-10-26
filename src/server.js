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
const s3 = new AWS.S3({params: {Bucket: 'giv-uploads', Key: 'default'}});
const appendFileExt = function(file) {
  if (file && file.mimetype) {
    if (file.mimetype.indexOf("jpeg") > -1) return ".jpg";
    else return "." + file.mimetype.match(/image\/(.*)/)[1];
  }
};

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

const userAvatarUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'giv-uploads',
    acl: 'public-read',
    key: function (req, file, callback) {
      req.newPath = "avatars/users/" + req.params.userId + "_" + Date.now().toString() + appendFileExt(file);
      console.log("Uploading "); console.log(file);
      callback(null, req.newPath);
    }
  }),
  limits: { fileSize: 3000000 }
});

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
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);
//mongoose.connect(process.env.MONGOLAB_URI);
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
//app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
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
app.post('/signup', userController.postSignup);
app.post('/forgot', userController.postForgot);
app.post('/reset/:token', userController.postReset);
app.post('/verify-email/:token', userController.verifyEmail);
app.post('/contact-form', contactController.postContact);
app.post('/account/profile', passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post('/account/upload/avatar/:userId', passportConfig.isAuthenticated, userAvatarUpload.any(), userController.uploadUserAvatar);
app.post('/account/password', passportConfig.isAuthenticated, userController.postUpdatePassword);
app.delete('/account/delete', passportConfig.isAuthenticated, userController.postDeleteAccount);
app.get('/account/unlink/:provider', passportConfig.isAuthenticated, userController.getOauthUnlink);
app.post('/interests', passportConfig.isAuthenticated, userController.showInterest);
app.get('/adminToken', passportConfig.isAuthenticated, userController.adminToken);
app.get('/user/:id', userController.getUser);
app.get('/user/u/:username', userController.getUserByUsername);
app.put('/user/star/:action', passportConfig.isAuthenticated, userController.star);
app.put('/donation/log', passportConfig.isAuthenticated, userController.logDonation);
app.post('/donation/delete/:id', passportConfig.isAuthenticated, userController.deleteDonation);

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


/** START giv api **/
mongoose.connection.on('error', () => {
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});
mongoose.connection.on('connected', () => {
  console.log('%s Connected to MongoDB', chalk.green('✓'));

  /**
  ** Orgs
  **/
  appService.addRoutes(app, orgController.routes);

  /**
  ** Posts
  **/
  appService.addRoutes(app, postController.routes);

  // all other routes are handled by Angular
  app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
  });











  var scrapedOrgs = JSON.parse('[{"category":"environmental","name":"Better Business Bureau Wise Giving   Alliance","donateLink":"http://www.give.org/","website":"http://www.give.org/"},{"category":"environmental","name":"Guidestar","donateLink":"http://www.guidestar.org/","website":"http://www.guidestar.org/"},{"category":"environmental","name":"350.org","donateLink":"http://www.350.org/","website":"http://www.350.org/"},{"category":"environmental","name":"Alliance for Climate Protection","donateLink":"http://climaterealityproject.org/","website":"http://climaterealityproject.org/"},{"category":"environmental","name":"The American Solar Energy Society","donateLink":"http://www.ases.org/","website":"http://www.ases.org/"},{"category":"environmental","name":"Climate Crisis","donateLink":"http://www.climatecrisis.net/","website":"http://www.climatecrisis.net/"},{"category":"environmental","name":"Fight Global Warming","donateLink":"http://www.fightglobalwarming.com/","website":"http://www.fightglobalwarming.com/"},{"category":"environmental","name":"The Vote Solar Initiative","donateLink":"http://www.votesolar.org/","website":"http://www.votesolar.org/"},{"category":"environmental","name":"African Wildlife Foundation","donateLink":"http://awf.org/","website":"http://awf.org/"},{"category":"environmental","name":"American Bird Conservancy","donateLink":"http://www.abcbirds.org/","website":"http://www.abcbirds.org/"},{"category":"environmental","name":"Association of Veterinarians for Animal   Rights","donateLink":"http://avar.org/","website":"http://avar.org/"},{"category":"environmental","name":"Animal Legal Defense Fund","donateLink":"http://www.aldf.org/","website":"http://www.aldf.org/"},{"category":"environmental","name":"Animal Place","donateLink":"http://AnimalPlace.org/","website":"http://AnimalPlace.org/"},{"category":"environmental","name":"Compassion in World Farming","donateLink":"http://www.ciwf.org/","website":"http://www.ciwf.org/"},{"category":"environmental","name":"Defenders of Wildlife","donateLink":"http://www.defenders.org/","website":"http://www.defenders.org/"},{"category":"environmental","name":"Farm Animal Reform Movement","donateLink":"http://www.farmusa.org/","website":"http://www.farmusa.org/"},{"category":"environmental","name":"The Fund for Animals","donateLink":"http://www.fundforanimals.org/","website":"http://www.fundforanimals.org/"},{"category":"environmental","name":"The Humane Farming Association","donateLink":"http://www.hfa.org/","website":"http://www.hfa.org/"},{"category":"environmental","name":"Humane Society of the U.S.","donateLink":"http://www.hsus.org/","website":"http://www.hsus.org/"},{"category":"environmental","name":"National Anti-Vivisection Society","donateLink":"http://www.navs.org/","website":"http://www.navs.org/"},{"category":"environmental","name":"National Audubon Society","donateLink":"http://www.audubon.org/","website":"http://www.audubon.org/"},{"category":"environmental","name":"National Wildlife Federation","donateLink":"http://www.nwf.org/","website":"http://www.nwf.org/"},{"category":"environmental","name":"The Progressive Animal Welfare Society   (PAWS)","donateLink":"http://www.paws.org/","website":"http://www.paws.org/"},{"category":"environmental","name":"People for the Ethical Treatment of   Animals","donateLink":"http://www.peta.org/","website":"http://www.peta.org/"},{"category":"environmental","name":"Psychologists for the Ethical Treatment of   Animals","donateLink":"http://www.psyeta.org/","website":"http://www.psyeta.org/"},{"category":"environmental","name":"Save the Chimps","donateLink":"http://www.savethechimps.org/","website":"http://www.savethechimps.org/"},{"category":"environmental","name":"Sea Shepherd Conservation Society","donateLink":"http://www.seashepherd.org/","website":"http://www.seashepherd.org/"},{"category":"environmental","name":"The Wilderness Society","donateLink":"http://www.wilderness.org/","website":"http://www.wilderness.org/"},{"category":"environmental","name":"World Animal Net","donateLink":"http://worldanimal.net/","website":"http://worldanimal.net/"},{"category":"environmental","name":"World Wildlife Fund","donateLink":"http://www.wwf.org/","website":"http://www.wwf.org/"},{"category":"environmental","name":"Adbusters","donateLink":"http://www.adbusters.org/","website":"http://www.adbusters.org/"},{"category":"environmental","name":"Biomimicry","donateLink":"http://www.biomimicry.net/","website":"http://www.biomimicry.net/"},{"category":"environmental","name":"Bioneers","donateLink":"http://www.bioneers.org/","website":"http://www.bioneers.org/"},{"category":"environmental","name":"The Center for a New American Dream","donateLink":"http://www.newdream.org/","website":"http://www.newdream.org/"},{"category":"environmental","name":"The Center for Sustainable Practice in the Arts","donateLink":"http://www.sustainablepractice.org/","website":"http://www.sustainablepractice.org/"},{"category":"environmental","name":"Debra Lynn Dadd","donateLink":"http://www.dld123.com/","website":"http://www.dld123.com/"},{"category":"environmental","name":"The Earth Pigments Company (non-toxic art and painting supplies) ","donateLink":"http://www.earthpigments.com/","website":"http://www.earthpigments.com/"},{"category":"environmental","name":"GreenBiz.com","donateLink":"http://www.greenbiz.com/","website":"http://www.greenbiz.com/"},{"category":"environmental","name":"Institute for Local Self-Reliance","donateLink":"http://www.ilsr.org/","website":"http://www.ilsr.org/"},{"category":"environmental","name":"The Regeneration Project","donateLink":"http://theregenerationproject.org/","website":"http://theregenerationproject.org/"},{"category":"environmental","name":"The International Council for Local Environmental Initiatives","donateLink":"http://www.iclei.org/","website":"http://www.iclei.org/"},{"category":"environmental","name":"International Sustainable Solutions ","donateLink":"http://www.i-sustain.com/","website":"http://www.i-sustain.com/"},{"category":"environmental","name":"The National Religious Partnership for the Environment ","donateLink":"http://www.nrpe.org/","website":"http://www.nrpe.org/"},{"category":"environmental","name":"The Natural Step","donateLink":"http://www.naturalstep.org/","website":"http://www.naturalstep.org/"},{"category":"environmental","name":"NetSquared: Remixing the Web for Social Change","donateLink":"http://www.netsquared.org/","website":"http://www.netsquared.org/"},{"category":"environmental","name":"Financial Integrity (formerly The New Roadmap Foundation)","donateLink":"http://www.financialintegrity.org/","website":"http://www.financialintegrity.org/"},{"category":"environmental","name":"Ode Magazine ","donateLink":"http://www.odemagazine.com/","website":"http://www.odemagazine.com/"},{"category":"environmental","name":"Path to Freedom","donateLink":"http://www.pathtofreedom.com/","website":"http://www.pathtofreedom.com/"},{"category":"environmental","name":"Responsible Purchasing Network (for organizations)","donateLink":"http://www.responsiblepurchasing.org/purchasing_guides/all/","website":"http://www.responsiblepurchasing.org/purchasing_guides/all/"},{"category":"environmental","name":"Resurgence","donateLink":"http://www.resurgence.org/","website":"http://www.resurgence.org/"},{"category":"environmental","name":"Rocky Mountain Institute","donateLink":"http://www.oilendgame.com/","website":"http://www.oilendgame.com/"},{"category":"environmental","name":"Sustainable Communities Network","donateLink":"http://www.sustainable.org/","website":"http://www.sustainable.org/"},{"category":"environmental","name":"Sustainable San Francisco","donateLink":"http://www.sustainable-city.org/","website":"http://www.sustainable-city.org/"},{"category":"environmental","name":"Sustainable Seattle","donateLink":"http://www.sustainableseattle.org/","website":"http://www.sustainableseattle.org/"},{"category":"environmental","name":"Sustainable Technology Education Project","donateLink":"http://www.stepin.org/","website":"http://www.stepin.org/"},{"category":"environmental","name":"Transition Network","donateLink":"http://www.transitionnetwork.org/about","website":"http://www.transitionnetwork.org/about"},{"category":"environmental","name":"Tree People","donateLink":"http://www.treepeople.org/","website":"http://www.treepeople.org/"},{"category":"environmental","name":"Worldwatch Institute","donateLink":"http://www.worldwatch.org/","website":"http://www.worldwatch.org/"},{"category":"environmental","name":"Yes!  Magazine ","donateLink":"http://www.yesmagazine.org/","website":"http://www.yesmagazine.org/"},{"category":"environmental","name":"American Civil Liberties Union","donateLink":"http://www.aclu.org/","website":"http://www.aclu.org/"},{"category":"environmental","name":"Amnesty International","donateLink":"http://www.amnesty.org/","website":"http://www.amnesty.org/"},{"category":"environmental","name":"Amnesty International USA","donateLink":"http://www.amnestyusa.org/","website":"http://www.amnestyusa.org/"},{"category":"environmental","name":"Children\'s Environmental Health Network","donateLink":"http://www.cehn.org/","website":"http://www.cehn.org/"},{"category":"environmental","name":"Clean Clothes Campaign","donateLink":"http://www.cleanclothes.org/","website":"http://www.cleanclothes.org/"},{"category":"environmental","name":"Doctors Without Borders","donateLink":"http://doctorswithoutborders.org/","website":"http://doctorswithoutborders.org/"},{"category":"environmental","name":"Feminist Majority","donateLink":"http://www.feminist.org/","website":"http://www.feminist.org/"},{"category":"environmental","name":"Free the Children","donateLink":"http://www.freethechildren.com/","website":"http://www.freethechildren.com/"},{"category":"environmental","name":"Human Rights Watch","donateLink":"http://www.hrw.org/","website":"http://www.hrw.org/"},{"category":"environmental","name":"National Organization for Women","donateLink":"http://www.now.org/","website":"http://www.now.org/"},{"category":"environmental","name":"One World","donateLink":"http://oneworld.org/","website":"http://oneworld.org/"},{"category":"environmental","name":"Oxfam America","donateLink":"http://www.oxfamamerica.org/","website":"http://www.oxfamamerica.org/"},{"category":"environmental","name":"Oxfam International","donateLink":"http://www.oxfam.org/","website":"http://www.oxfam.org/"},{"category":"environmental","name":"Population Connection","donateLink":"http://www.populationconnection.org/","website":"http://www.populationconnection.org/"},{"category":"environmental","name":"American Forestry Association","donateLink":"http://www.americanforests.org/","website":"http://www.americanforests.org/"},{"category":"environmental","name":"American Hiking Society","donateLink":"http://www.americanhiking.org/","website":"http://www.americanhiking.org/"},{"category":"environmental","name":"American Rivers","donateLink":"http://www.americanrivers.org/","website":"http://www.americanrivers.org/"},{"category":"environmental","name":"The Campaign (to label genetically   engineered foods)","donateLink":"http://www.thecampaign.org/","website":"http://www.thecampaign.org/"},{"category":"environmental","name":"Center for Biological   Diversity","donateLink":"http://www.biologicaldiversity.org/","website":"http://www.biologicaldiversity.org/"},{"category":"environmental","name":"Center for Food Safety and the True Food Network","donateLink":"http://truefoodnow.org/","website":"http://truefoodnow.org/"},{"category":"environmental","name":"Center for Health, Environment, and   Justice","donateLink":"http://www.chej.org/","website":"http://www.chej.org/"},{"category":"environmental","name":"Clean Water Action","donateLink":"http://www.cleanwateraction.org/","website":"http://www.cleanwateraction.org/"},{"category":"environmental","name":"Conservation International","donateLink":"http://www.conservation.org/","website":"http://www.conservation.org/"},{"category":"environmental","name":"The Council for Responsible Genetics","donateLink":"http://www.gene-watch.org/","website":"http://www.gene-watch.org/"},{"category":"environmental","name":"Earth Island Institute","donateLink":"http://www.earthisland.org/","website":"http://www.earthisland.org/"},{"category":"environmental","name":"Earthjustice Legal Defense Fund","donateLink":"http://www.earthjustice.org/","website":"http://www.earthjustice.org/"},{"category":"environmental","name":"Earthwatch Institute","donateLink":"http://www.earthwatch.org/","website":"http://www.earthwatch.org/"},{"category":"environmental","name":"Environmental   Defense","donateLink":"http://www.edf.org/","website":"http://www.edf.org/"},{"category":"environmental","name":"Food First","donateLink":"http://www.foodfirst.org/","website":"http://www.foodfirst.org/"},{"category":"environmental","name":"Friends of the Earth","donateLink":"http://www.foei.org/","website":"http://www.foei.org/"},{"category":"environmental","name":"Genetic Engineering Action Network","donateLink":"http://www.geaction.org/","website":"http://www.geaction.org/"},{"category":"environmental","name":"GeneWatch UK","donateLink":"http://www.genewatch.org/","website":"http://www.genewatch.org/"},{"category":"environmental","name":"Global Exchange","donateLink":"http://www.globalexchange.org/","website":"http://www.globalexchange.org/"},{"category":"environmental","name":"Global Securities Institute","donateLink":"http://www.gsinstitute.org/","website":"http://www.gsinstitute.org/"},{"category":"environmental","name":"GRACE (Global Resource Action Center for   the Environment)","donateLink":"http://gracelinks.org/","website":"http://gracelinks.org/"},{"category":"environmental","name":"Greenpeace International","donateLink":"http://www.greenpeace.org/usa/en/","website":"http://www.greenpeace.org/usa/en/"},{"category":"environmental","name":"Greenpeace U.S.A.","donateLink":"http://www.greenpeace.org/usa/en/","website":"http://www.greenpeace.org/usa/en/"},{"category":"environmental","name":"Health Care Without Harm","donateLink":"http://www.noharm.org/","website":"http://www.noharm.org/"},{"category":"environmental","name":"The Institute for Agriculture and Trade   Policy","donateLink":"http://www.iatp.org/","website":"http://www.iatp.org/"},{"category":"environmental","name":"League of Conservation Voters","donateLink":"http://www.lcv.org/","website":"http://www.lcv.org/"},{"category":"environmental","name":"Mothers for Natural Law","donateLink":"http://www.safe-food.org/","website":"http://www.safe-food.org/"},{"category":"environmental","name":"National Arbor Day Foundation","donateLink":"http://www.arborday.org/","website":"http://www.arborday.org/"},{"category":"environmental","name":"National Parks and Conservation   Association","donateLink":"http://www.npca.org/","website":"http://www.npca.org/"},{"category":"environmental","name":"Natural Resources Defense Council","donateLink":"http://www.nrdc.org/","website":"http://www.nrdc.org/"},{"category":"environmental","name":"The Nature Conservancy","donateLink":"http://www.nature.org/","website":"http://www.nature.org/"},{"category":"environmental","name":"Oceana","donateLink":"http://na.oceana.org/","website":"http://na.oceana.org/"},{"category":"environmental","name":"Organic Consumers Association","donateLink":"http://www.organicconsumers.org/","website":"http://www.organicconsumers.org/"},{"category":"environmental","name":"The Ocean Conservancy","donateLink":"http://www.oceanconservancy.org/","website":"http://www.oceanconservancy.org/"},{"category":"environmental","name":"Pesticide Action Network","donateLink":"http://www.panna.org/","website":"http://www.panna.org/"},{"category":"environmental","name":"Physicians for Social Responsibility","donateLink":"http://www.psr.org/","website":"http://www.psr.org/"},{"category":"environmental","name":"Rainforest Action Network","donateLink":"http://www.ran.org/","website":"http://www.ran.org/"},{"category":"environmental","name":"Rails-To-Trails Conservancy","donateLink":"http://www.railtrails.org/","website":"http://www.railtrails.org/"},{"category":"environmental","name":"Rainforest Alliance","donateLink":"http://www.rainforest-alliance.org/","website":"http://www.rainforest-alliance.org/"},{"category":"environmental","name":"Sierra Club","donateLink":"http://www.sierraclub.org/","website":"http://www.sierraclub.org/"},{"category":"environmental","name":"The Student Conservation Association","donateLink":"http://www.thesca.org/","website":"http://www.thesca.org/"},{"category":"environmental","name":"Surfrider Foundation","donateLink":"http://www.surfrider.org/","website":"http://www.surfrider.org/"},{"category":"environmental","name":"Trees for the Future","donateLink":"http://www.treesftf.org/","website":"http://www.treesftf.org/"},{"category":"environmental","name":"State Public Interest Research Groups","donateLink":"http://www.uspirg.org/","website":"http://www.uspirg.org/"},{"category":"environmental","name":"Union of Concerned Scientists","donateLink":"http://www.ucsusa.org/","website":"http://www.ucsusa.org/"}]');
  // var addOrgs = false;
  // if (addOrgs) {
  //   orgController.insert(scrapedOrgs, function() {
  //     console.log("success!");
  //   });
  // }


  var generateOrgs = false;
  if (generateOrgs) {
    let i = 0;
    while (i < 50) {
      orgController.sample(function(err, obj) {
        User.find({email: { $or: ["d.a.mayer92@gmail.com", "danny@hyzershop.com"] }}, function(err, users) { // Give users globalPermission
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

  const Post = require('./models/Post');

  var generateSomePosts = false;
  if (generateSomePosts) {
    let i = 0;
    while (i < 50) {
      postController.sample();
      i++;
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




/** END giv api **/

module.exports = app;
