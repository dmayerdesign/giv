/**
 * Module dependencies.
 */
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const search = require('../services/search');


const Org = require('../models/Org');

exports.routes = [
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
      dbQuery.verified = true;
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
    middleware: "passport",
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
      Org.findOne({_id: req.params.id, verified: true}, function (err, obj) {
        if(err) return console.error(err);
        res.json(obj);
      });
    }
  },

  {
    method: "put",
    uri: "/org/:id",
    middleware: "passport",
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
    middleware: "passport",
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
      Org.findOne({slug: req.params.slug, verified: true}, function (err, obj) {
        if(err) return console.error(err);
        res.json(obj);
      });
    }
  },

  {
    method: "put",
    uri: "/org/s/:slug",
    middleware: "passport",
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
    uri: "/edit-org/upload/cover-image/:orgId",
    middleware: "upload",
    process: function(req, res, next) {
      let updateQuery = {$set:{}};
      updateQuery.$set.coverImage = "https://d1poe49zt5yre3.cloudfront.net/" + req.newPath;
      //updateQuery.$set.coverImage = "https://s3.amazonaws.com/fuse-uploads/" + req.newPath;
      Org.findOneAndUpdate({_id: req.params.orgId}, updateQuery, {new: true}, function(err, obj) {
        if(err) {
          console.error(err);
          res.send(400).json(err);
        }
        else {
          console.log(obj.coverImage);
          res.json(obj);
        } 
      });
    }
  }
];

/*
** Edit Organization (refactored code)
*/
let editableInOrg = [
  "coverImage",
  "donateLink",
  "slug",
  "name",
  "verified",
  "featured"
];
for (let i = 0; i < editableInOrg.length; i++) {
  exports.routes.push(editOrg(editableInOrg[i]));
}
// helper function to edit org
function editOrg(key) {
  return {
    method: "put",
    uri: '/edit-org/'+key+'/:orgId',
    middleware: "passport",
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

exports.sample = function(next) {
  let newOrg = new Org({
    "name": makeid(),
    "slug": makeid(),
    "email": makeid(),
    "verified": true,
    "stars": Math.ceil(Math.random()*300)
  });
  newOrg.save(function(err, obj) {
    if(err) return console.log(err);
    console.log(obj);
    next(err, obj);
  });

  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ     abcdefghijklmnopqrstuvwxyz-";

    for( var i=0; i < 20; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
};