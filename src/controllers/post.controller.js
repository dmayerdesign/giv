/**
 * Module dependencies.
 */
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const search = require('../services/search'); // helper function for creating a database query

const Post = require('../models/Post');
const Org = require('../models/Org');

/* For testing */
const words = require('../services/sample-data/words');

exports.routes = [
  { method: "get",
    uri: "/posts/get",
    process: function(req, res) {
      var dbQuery = {};
      var dbQuery2 = null;
      console.log(req.query);
      if (req.query.search) {
        dbQuery = search(req.query.search, req.query.field);
      }
      if (req.query.bodyField) {
        dbQuery2 = search(req.query.search, req.query.bodyField);
      }
      if (req.query.filterField) {
        dbQuery[req.query.filterField] = req.query.filterValue;
        if (dbQuery2)
          dbQuery2[req.query.filterField] = req.query.filterValue;
      }

      if (dbQuery2) {
        Post.find().or([dbQuery, dbQuery2])
        .sort(req.query.sort || "-dateCreated")
        .skip(+req.query.offset)
        .limit(+req.query.limit)
        .exec((err, docs) => {
          if(err) return console.error(err);
          res.json(docs);
        })
      }
      else {
        Post.find(dbQuery, (err, docs) => {
          if(err) return console.error(err);
          res.json(docs);
        })
        .sort(req.query.sort || "-dateCreated")
        .skip(+req.query.offset)
        .limit(+req.query.limit);
      }
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
      var newPost = new Post(req.body);
      Post.create(newPost, function(err, post) {
        if(err) return console.log(err);
        console.log(post);
        res.status(200).json(post);
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
    method: "delete",
    uri: "/post/:id",
    middleware: "passport",
    process: function(req, res) {
      Post.findOneAndRemove({_id: req.params.id}, function(err) {
        if(err) {
          console.error(err);
          return res.status(500).json({errmsg: err});
        }
        res.status(200).json({success: "Post was deleted"});
      });
    }
  },

  {
    method: "put",
    uri: "/edit-post/:id",
    middleware: "passport",
    process: function(req, res) {
      Post.findOne({_id: req.params.id}, function (err, post) {
        if(err) {
          res.json({errmsg: err});
          return console.log(err);
        }
        for (let field in req.body) {
          post[field] = req.body[field];
        }
        post.save((err, post) => {
          if(err) {
            res.json({errmsg: err});
            return console.log(err);
          }
          console.log(post);
          res.status(200).json(post);
        });
      });
    }
  },

  // file uploads with multer-s3
  {
    method: "post",
    uri: "/post/upload/featuredImage/:bucket",
    middleware: "attach",
    process: function(req, res, next) {
      console.log(req.newPath);
      res.send("https://d1poe49zt5yre3.cloudfront.net/" + req.newPath);
      if (next) next();
    }
  }
];

exports.sample = function(next) {
  let newPost = new Post({
    "title": make('name'),
    "content": make('desc'),
    "likes": Math.floor(Math.random()*10)
  });

  Org.count(function(err, count) {
    var rand = Math.floor(Math.random() * count);
    Org.findOne().skip(rand).exec((err, org) => {
      newPost.org = org._id;
      newPost.save(function(err, obj) {
        if(err) return console.log(err);
        console.log(obj);
        if (next) next(err, obj);
      });
    });
  });

  function make(what) {
    let cleanWords = words.replace(/[^a-zA-Z.,]/g, "");
    let wordsArr = words.split(" ");
    let maxLen = (what === "name") ? 5 : 50;
    let nameLen = Math.ceil(Math.random() * maxLen);
    if (what === "desc") {
      nameLen += 60;
    }
    let randomIndex = function() {
      return Math.floor(Math.random() * wordsArr.length);
    };
    let str = [];
    for (let i = 0; i < nameLen; i++) {
      str.push(wordsArr[randomIndex()]);
    }
    str = str.join(" ");
    let firstLetter = str.charAt(0);
    str = str.slice(1);
    str = firstLetter.toUpperCase() + str;
    return str;
  }
};