/**
 * Module dependencies.
 */
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const search = require('../services/search'); // helper function for creating a database query

const Post = require('../models/Post');
const Org = require('../models/Org');

exports.routes = [
  { method: "get",
    uri: "/posts/get",
    process: function(req, res) {
      var dbQuery = {};
      console.log(req.query);
      if (req.query.search) {
        dbQuery = search(req.query.search, req.query.field);
      }
      if (req.query.filterField) {
        dbQuery[req.query.filterField] = req.query.filterValue;
      }
      Post.find(dbQuery, (err, docs) => {
        if(err) return console.error(err);
        res.json(docs);
      })
      .sort(req.query.sort || "-dateCreated")
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
    middleware: "passport",
    uri: '/post',
    //middleware: "passport",
    process: function(req, res) {
      console.log(req.body);
      var obj = new Post(req.body);
      obj.save(function(err, obj) {
        if(err) return console.error(err);
        console.log(obj);
        Org.findById(obj.org, function(err, org) {
          if(err) return console.error(err);
          org.posts.push(obj._id);
          org.save((err, org) => {
            if(err) return res.status(500).json(err);
            res.status(200).json(org);
          })
        })
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
    uri: "/post/upload/featuredImage/:bucket",
    middleware: "upload",
    process: function(req, res, next) {
      console.log(req.newPath);
      res.send("https://d1poe49zt5yre3.cloudfront.net/" + req.newPath);
      if (next) next();
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