/**
 * Module dependencies.
 */
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

const AWS = require('aws-sdk'); AWS.config.region = 'us-west-2';
const multer = require('multer');
const multerS3 = require('multer-s3');

const search = require('../services/search');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env' });

/**
 * AWS S3 uploads
 */
const s3 = new AWS.S3({params: {Bucket: 'fuse-uploads', Key: 'default'}});
const initial_upload = multer({ dest: path.join(__dirname, 'uploads') });

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'fuse-uploads',
    acl: 'public-read',
    key: function (req, file, callback) {
        req.newPath = "cover-images/" + req.params.orgId + "_" + Date.now().toString() + ".jpg";
        console.log(file);
        callback(null, req.newPath);
    }
  }),
  limits: { fileSize: 5000000 }
});

const Org = require('../models/Org');

exports.sample = function(next) {
  let newOrg = new Org({"name": makeid(), "slug": makeid(), "email": makeid()});
  newOrg.save(function(err, obj) {
    if(err) return console.log(err);
    console.log(obj);
    next(err, obj);
  });

  function makeid()
  {
      var text = "";
      var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-";

      for( var i=0; i < 10; i++ )
          text += possible.charAt(Math.floor(Math.random() * possible.length));

      return text;
  }
};

exports.requests = [
  { method: "get",
    uri: "/orgs/get",
    process: function(req, res) {
      var dbQuery = {};
      if (req.query.search) {
        dbQuery = search(req.query.search, req.query.field);
      }
      if (req.query.filterField) {
        dbQuery[req.query.filterField] = req.query.filterValue;
      }
      Org.find(dbQuery, (err, docs) => {
        if(err) return console.error(err);
        res.json(docs);
      })
      .sort("-stars")
      .skip(+req.query.offset)
      .limit(+req.query.limit);
    }
  },

  // count all
  { method: "get",
    uri: '/orgs/count',
    process: function(req, res) {
      Org.count(function(err, count) {
        if(err) return console.error(err);
        res.json(count);
      });
    }
  },

  // create
  { method: "post",
    uri: '/org',
    process: function(req, res) {
      var obj = new Org(req.body);
      obj.save(function(err, obj) {
        if(err) return console.error(err);
        console.log(obj);
        res.status(200).json(obj);
      });
    }
  },

  {
    method: "get",
    uri: "/org/:id",
    process: function(req, res) {
      Org.findOne({_id: req.params.id}, function (err, obj) {
        if(err) return console.error(err);
        res.json(obj);
      });
    }
  },

  {
    method: "put",
    uri: "/org/:id",
    process: function(req, res) {
      Org.findOneAndUpdate({_id: req.params.id}, req.body, function (err) {
        if(err) return console.error(err);
        res.sendStatus(200);
      });
    }
  },

  {
    method: "delete",
    uri: "/org/:id",
    process: function(req, res) {
      Org.findOneAndRemove({_id: req.params.id}, function(err) {
        if(err) return console.error(err);
        res.sendStatus(200);
      });
    }
  },

  {
    method: "get",
    uri: "/org/s/:slug",
    process: function(req, res) {
      Org.findOne({slug: req.params.slug}, function (err, obj) {
        if(err) return console.error(err);
        res.json(obj);
      });
    }
  },

  {
    method: "put",
    uri: "/org/s/:slug",
    process: function(req, res) {
      Org.findOneAndUpdate({slug: req.params.slug}, req.body, function (err) {
        if(err) return console.error(err);
        res.sendStatus(200);
      });
    }
  },

  {
    method: "delete",
    uri: "/org/s/:slug",
    process: function(req, res) {
      Org.findOneAndRemove({slug: req.params.slug}, function(err) {
        if(err) return console.error(err);
        res.sendStatus(200);
      });
    }
  },

  // file uploads with multer-s3
  {
    method: "post",
    uri: "edit-org/upload/cover-image/:orgId",
    middleware: [upload.any],
    process: function(req, res, next) {
      Org.findOne({_id: req.params.orgId}, function(err, obj) {
        if(err) return console.error(err);
        obj.coverImage = "https://s3.amazonaws.com/fuse-uploads/" + req.newPath;
        console.log(obj.coverImage);
        obj.save(function(err, org) {
          if(err) return console.error(err);
          res.json(org);
        }); 
      });
    }
  }
];




// edit org
let editableInOrg = [
  "coverImage",
  "donateLink",
  "slug"
];
for (let i = 0; i < editableInOrg.length; i++) {
  exports.requests.push(editOrg(editableInOrg[i]));
}
// helper function to edit org
function editOrg(key) {
  return {
    method: "put",
    uri: '/edit-org/'+key+'/:orgId',
    process: function(req, res) {
      let updateQuery = {$set:{}};
      updateQuery.$set[key] = req.body.value;
      Org.findOneAndUpdate({_id: req.params.orgId}, updateQuery, {new: true}, function(err, org) {
        if(err) {
          res.json(err);
          console.log(err);
        }
        console.log(org);
        res.status(200).json(org);
      });
    }
  }
}