const path = require('path');
const passportConfig = require('../config/passport');
/**
 * AWS S3 uploads
 */
const AWS = require('aws-sdk'); AWS.config.region = 'us-west-2';
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = new AWS.S3({params: {Bucket: 'fuse-uploads', Key: 'default'}});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'fuse-uploads',
    acl: 'public-read',
    key: function (req, file, callback) {
      req.newPath = "cover-images/" + req.params.orgId + "_" + Date.now().toString() + ".jpg";
      console.log("Uploading "); console.log(file);
      callback(null, req.newPath);
    }
  }),
  limits: { fileSize: 3000000 }
});

const attach = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'fuse-uploads',
    acl: 'public-read',
    key: function (req, file, callback) {
      req.newPath = "post-uploads/" + req.params.bucket + "/" + Date.now().toString() + ".jpg";
      console.log("Uploading "); console.log(file);
      callback(null, req.newPath);
    }
  }),
  limits: { fileSize: 3000000 }
});


module.exports = {
  applyRoutes: function(app, routes) {
    for (let i = 0; i < routes.length; i++) {
      let request = routes[i];
      if (request.middleware) {
        if (request.middleware === "upload") app[request.method](request.uri, passportConfig.isAuthenticated, upload.any(), request.process);
        if (request.middleware === "attach") app[request.method](request.uri, passportConfig.isAuthenticated, attach.any(), request.process);
        if (request.middleware === "passport") app[request.method](request.uri, passportConfig.isAuthenticated, request.process);
      }
      else {
        app[request.method](request.uri, request.process);
      }
    }
  }
}