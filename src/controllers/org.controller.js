/**
 * Module dependencies.
 */
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const search = require('../services/search');

/* For testing */
const words = require('../services/sample-data/words');
const categories = [
  { name: "Racial Justice", id: "racial" },
  { name: "LGBTQIA Justice", id: "lgbtqia" },
  { name: "Environmental Justice", id: "environmental" },
  { name: "Reproductive Rights", id: "reproductive" },
  { name: "Economic Justice", id: "economic" },
  { name: "Other", id: "other" }
];

const Org = require('../models/Org');
const User = require('../models/User');

exports.routes = [
  { // GET ORGS
    method: "get",
    uri: "/orgs/get",
    process: function(req, res) {
      var dbQuery = {};
      var dbQuery2 = null;

      console.log("Initial query", req.query);

      if (req.query.getSome) {
        dbQuery['$or'] = [];
        let ids = req.query.ids.split(",");
        let i = 0;
        while (i < ids.length) {
          dbQuery.$or.push({_id: ids[i]});
          i++;
        }
      }

      if (req.query.search) {
        dbQuery = search(req.query.search, req.query.field);
      }
      if (req.query.bodyField) {
        dbQuery2 = search(req.query.search, req.query.bodyField);
      }
      if (req.query.filterField && req.query.filterValue) {
        dbQuery[req.query.filterField] = req.query.filterValue;
        if (dbQuery2)
          dbQuery2[req.query.filterField] = req.query.filterValue;
      }
      dbQuery.verified = true;
      if (dbQuery2) dbQuery2.verified = true;

      if (req.query.not) {
        dbQuery["_id"] = { $nin: [] };
        let arrayOfIdsToExclude = req.query.not.split(",");
        arrayOfIdsToExclude.forEach(id => {
          dbQuery._id.$nin.push(id);
        });
      }

      console.log(req.query);
      console.log("Query 1", dbQuery);
      console.log("Query 2", dbQuery2);

      if (dbQuery2 && typeof dbQuery2 !== "undefined") {
        Org.find().or([dbQuery, dbQuery2])
        .sort(req.query.sort || "-favorites")
        .skip(+req.query.offset)
        .limit(+req.query.limit)
        .exec((err, docs) => {
          if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
          res.json(docs);
        })
      }
      else {
        Org.find(dbQuery, (err, docs) => {
          if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
          res.json(docs);
        })
        .sort("-favorites")
        .skip(+req.query.offset)
        .limit(+req.query.limit);
      }
    }
  },

  { // GET UNVERIFIED ORGS
    method: "get",
    uri: "/orgs/unverified/get",
    middleware: "passport",
    process: function(req, res) {
      var dbQuery = {};
      var dbQuery2 = null;
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
      dbQuery.verified = false;
      if (dbQuery2) dbQuery2.verified = false;

      console.log(req.query);
      console.log("Query 1", dbQuery);
      console.log("Query 2", dbQuery2);

      if (dbQuery2) {
        Org.find().or([dbQuery, dbQuery2])
        .sort(req.query.sort || "-dateCreated")
        .skip(+req.query.offset)
        .limit(+req.query.limit)
        .exec((err, docs) => {
          if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
          res.json(docs);
        })
      }
      else {
        Org.find(dbQuery, (err, docs) => {
          if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
          res.json(docs);
        })
        .sort("-dateCreated")
        .skip(+req.query.offset)
        .limit(+req.query.limit);
      }
    }
  },

  { // GET FAVORITES
    method: "get",
    uri: "/orgs/get/favorites",
    process: function(req, res) {
      var dbQuery = {};
      dbQuery._id = {
        $in: req.query.favorites.split(",")
      }
      dbQuery.verified = true;

      console.log("Query favorites: ", dbQuery);
      Org.find(dbQuery, (err, docs) => {
        if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
        res.json(docs);
      });
    }
  },

  { // GET COUNT
    method: "get",
    uri: '/orgs/count',
    process: function(req, res) {
      Org.count(function(err, count) {
        if(err) {
          console.log(err);
          return res.status(500).json({errmsg: err});
        }        
        res.status(200).json(count);
      });
    }
  },

  { // CREATE
    method: "post",
    uri: '/org',
    middleware: "passport",
    process: function(req, res) {
      var obj = new Org(req.body);
      obj.save(function(err, obj) {
        if(err) {
          res.json({errmsg: "Couldn't create your organization. It's possible that one already exists with the same name."});
          return console.log(err);
        }
        console.log(obj);
        res.status(200).json(obj);
      });
    }
  },

  // GET SINGLE
  {
    method: "get",
    uri: "/org/:id",
    process: function(req, res) {
      Org.findOne({_id: req.params.id, verified: true}, function (err, obj) {
        if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
        res.json(obj);
      });
    }
  },

  // GET BY NAME
  {
    method: "get",
    uri: "/org-name/:name",
    process: function(req, res) {
      console.log("GETTING NAME:", req.params.name);
      Org.findOne({name: decodeURIComponent((req.params.name+'').replace(/\+/g, '%20')), verified: true}, function (err, org) {
        console.log(err);
        console.log(org);
        if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
        if (!org) {
          return res.json([]);
        }
        res.json(org);
      });
    }
  },

  {
    method: "put",
    uri: "/org/:id",
    middleware: "passport",
    process: function(req, res) {
      Org.findOneAndUpdate({_id: req.params.id}, req.body, function (err) {
        if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
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
        if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
        res.status(200).json({success: true});
      });
    }
  },

  {
    method: "get",
    uri: "/org/s/:slug",
    process: function(req, res) {
      Org.findOne({slug: req.params.slug, verified: true}, function (err, obj) {
        if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
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
        if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
        res.sendStatus(200);
      });
    }
  },

  {
    method: "delete",
    uri: "/org/s/:slug",
    process: function(req, res) {
      Org.findOneAndRemove({slug: req.params.slug}, function(err) {
        if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
        res.sendStatus(200);
      });
    }
  },

  {
    method: "post",
    uri: "/org/rate/:id",
    process: function(req, res) {
      if (!req.body.rating || req.body.rating == "undefined") {
        return res.json({errmsg: "Sorry, something went wrong and your rating didn't go through"});
      }
      let rating = +req.body.rating;
      let rater = req.body.userId;
      Org.findById(req.params.id, function(err, org) {
        if(err) {
          console.log(err);
          return res.status(400).json({errmsg: err});
        }
        if (!org.ratings) org.ratings = [];
        if (org.ratings.filter(rating => {
          return rating.user == rater;
        }).length) {
          return res.json({errmsg: "Sorry—you can't rate an organization more than once"});
        }

        console.log("RATING:");
        console.log(rating);

        const oldRating = org.rating || 0;
        const ratingsLen = org.ratings.length || 0;
        let newRating = ((oldRating*ratingsLen/10 + rating) / (ratingsLen+1))*10;

        org.rating = newRating;
        org.ratings.push({user: rater, rating: rating * 10});
        let updateQuery = { $set: { rating: org.rating, ratings: org.ratings } };

        Org.findOneAndUpdate({_id: req.params.id}, updateQuery, {new: true}, function(err, newOrg) {
          if(err) {
            console.log(err);
            res.status(400).json({errmsg: err});
          }
          else {
            res.json(newOrg);
          }
        });
      });
    }
  },

  // file uploads with multer-s3
  {
    method: "post",
    uri: "/edit-org/upload/cover-image/:orgId",
    middleware: "uploadCover",
    process: function(req, res, next) {
      let updateQuery = {$set:{}};
      updateQuery.$set.coverImage = "https://d1poe49zt5yre3.cloudfront.net/" + req.newPath;
      //updateQuery.$set.coverImage = "https://s3.amazonaws.com/fuse-uploads/" + req.newPath;
      Org.findOneAndUpdate({_id: req.params.orgId}, updateQuery, {new: true}, function(err, obj) {
        if(err) {
          console.log(err);
          res.status(400).json({errmsg: err});
        }
        else {
          console.log(obj.coverImage);
          res.json(obj);
        } 
      });
    }
  },

  {
    method: "post",
    uri: "/edit-org/upload/avatar/:orgId",
    middleware: "uploadOrgAvatar",
    process: function(req, res, next) {
      let updateQuery = {$set:{}};
      updateQuery.$set.avatar = "https://d1poe49zt5yre3.cloudfront.net/" + req.newPath;
      //updateQuery.$set.avatar = "https://s3.amazonaws.com/fuse-uploads/" + req.newPath;
      Org.findOneAndUpdate({_id: req.params.orgId}, updateQuery, {new: true}, function(err, obj) {
        if(err) {
          console.log(err);
          res.status(400).json({errmsg: err});
        }
        else {
          console.log(obj.avatar);
          res.json(obj);
        } 
      });
    }
  },

  {
    method: "post",
    uri: "/verify-org/:orgId",
    process: function(req, res) {
      let updateQuery = {$set: { verified: true }};
      if (req.body.managerId) {
        updateQuery.$set.managers = [req.body.managerId];
      }
      Org.findOneAndUpdate({_id: req.params.orgId}, updateQuery, {new: true}, function(err, org) {
        if(err) {
          console.log(err);
          res.status(400).json({errmsg: err});
        }
        else {
          if (req.body.managerId) {
            User.findById(req.body.managerId, function(err, user) {
              if(err) {
                console.log(err);
                res.status(400).json({errmsg: err});
              }
              else {
                if (!user.permissions) {
                  user.permissions = [];
                }
                user.permissions.push(org.globalPermission);
                user.save(function(err, newUser) {
                  if(err) {
                    console.log(err);
                    res.status(400).json({errmsg: err});
                  }
                  else {
                    res.json(org);
                  }
                });
              }
            });
          }
          else {
            res.json(org);
          }
        }
      });
    }
  }

];

/*
** Edit Organization
*/
let editableInOrg = [
  "avatar",
  "coverImage",
  "donateLink",
  "donateLinkCopy",
  "otherLinks",
  "slug",
  "name",
  "type",
  "description",
  "verified",
  "featured",
  "categories",
  "videoLink",
  "facebook"
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
          res.json({errmsg: err});
          return console.log(err);
        }
        if(org) {
          console.log("key: ", key);
          console.log("value: ", req.body.value);

          if(err) {
            res.json({errmsg: err});
            console.log(err);
          }
          if(org) {
            console.log(org);
            res.status(200).json(org);
          }
        }       
      });
    }
  }
}


exports.sample = function(next) {
  let newOrg = new Org({
    "name": make('name'),
    "description": make('desc'),
    "categories": addCategories(),
    "verified": true,
    "favorites": Math.floor(Math.random()*20)
  });

  newOrg.save(function(err, obj) {
    if(err) {
      console.log(err);
      return res.status(400).json({errmsg: err});
    }
    console.log(obj);
    next(err, obj);
  });

  function addCategories() {
    let newCats = [];
    let catsLen = Math.ceil(Math.random() * 2);
    let index = Math.floor(Math.random() * 6);
    for (let i = 0; i < catsLen; i++) {
      if ((index + i) < 6) {
        newCats.push(categories[index + i]);
      }
    }
    return newCats;
  }

  function make(what) {
    let cleanWords = words.replace(/[^a-zA-Z.,]/g, "");
    let wordsArr = words.split(" ");
    let maxLen = (what === "name") ? 5 : 50;
    let nameLen = Math.ceil(Math.random() * maxLen);
    if (what === "desc") {
      nameLen += 10;
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

exports.insert = function(orgs, next) {
  orgs.forEach(org => {
    let newOrg = new Org(org);
    newOrg.verified = true;
    newOrg.description = " ";
    newOrg.categories = [{id: org.category, name: org.categoryName}];
    delete newOrg.category;

    newOrg.save(function(err, obj) {
      if(err) {
      console.log(err);
      return res.status(400).json({errmsg: err});
    }
      console.log(obj);
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
  });

  next();
};