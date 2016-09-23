/**
 * Module dependencies.
 */
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const search = require('../services/search');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ path: '.env' });

const Post = require('../models/Post');

exports.routes = [
  { method: "get",
    uri: "/posts/get",
    process: function(req, res) {
      var dbQuery = {};
      if (req.query.search) {
        dbQuery = search(req.query.search, req.query.field);
      }
      if (req.query.filterField) {
        dbQuery[req.query.filterField] = req.query.filterValue;
      }
      dbQuery.verified = true;
      Post.find(dbQuery, (err, docs) => {
        if(err) return console.error(err);
        res.json(docs);
      })
      .sort("-likes")
      .skip(+req.query.offset)
      .limit(+req.query.limit);
    }
  },

  // count all
  { method: "get",
    uri: '/posts/count',
    process: function(req, res) {
      Post.count(function(err, count) {
        if(err) return console.error(err);
        res.json(count);
      });
    }
  },

  // create
  { method: "post",
    uri: '/post',
    middleware: "passport",
    process: function(req, res) {
      var obj = new Post(req.body);
      obj.save(function(err, obj) {
        if(err) return console.error(err);
        console.log(obj);
        res.status(200).json(obj);
      });
    }
  },

  {
    method: "get",
    uri: "/post/:id",
    process: function(req, res) {
      Post.findOne({_id: req.params.id, verified: true}, function (err, obj) {
        if(err) return console.error(err);
        res.json(obj);
      });
    }
  },

  {
    method: "put",
    uri: "/post/:id",
    middleware: "passport",
    process: function(req, res) {
      Post.findOneAndUpdate({_id: req.params.id}, req.body, function (err) {
        if(err) return console.error(err);
        res.sendStatus(200);
      });
    }
  },

  {
    method: "delete",
    uri: "/post/:id",
    middleware: "passport",
    process: function(req, res) {
      Post.findOneAndRemove({_id: req.params.id}, function(err) {
        if(err) return console.error(err);
        res.sendStatus(200);
      });
    }
  },

  // file uploads with multer-s3
  {
    method: "post",
    uri: "/edit-post/upload/image/:id",
    middleware: "upload",
    process: function(req, res, next) {
      let updateQuery = {$push:{}};
      updateQuery.$push.images = "https://d1poe49zt5yre3.cloudfront.net/" + req.newPath;
      //updateQuery.$push.images = "https://s3.amazonaws.com/fuse-uploads/" + req.newPath;
      Post.findOneAndUpdate({_id: req.params.postId}, updateQuery, {new: true}, function(err, obj) {
        if(err) {
          console.error(err);
          res.send(400).json(err);
        }
        else {
          console.log(obj.images);
          res.json(obj);
        } 
      });
    }
  }
];

/*
** Edit Post (refactored code)
*/
let editableInPost = [
  "title",
  "content"
];
for (let i = 0; i < editableInPost.length; i++) {
  exports.routes.push(editPost(editableInPost[i]));
}
// helper function to edit post
function editPost(key) {
  return {
    method: "put",
    uri: '/edit-post/'+key+'/:postId',
    middleware: "passport",
    process: function(req, res) {
      let updateQuery = {$set:{}};
      updateQuery.$set[key] = req.body.value;
      Post.findOneAndUpdate({_id: req.params.postId}, updateQuery, {new: true}, function(err, post) {
        if(err) {
          res.json(err);
          console.log(err);
        }
        console.log(post);
        res.status(200).json(post);
      });
    }
  }
}