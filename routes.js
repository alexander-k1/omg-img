"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const mongo = require("mongodb").MongoClient;
const app = express();
const ObjectID = require("mongodb").ObjectID;
const { Int32 } = require("mongodb");
const axios = require("axios");
const FormData = require("form-data");
const fileUpload = require("express-fileupload");

module.exports = function(app, db) {
  app.use(fileUpload());

  function createPipeline(imgPerPage, page, userid) {
    if (userid) {
      return [
        {
          $facet: {
            numimages: [
              {
                $match: {
                  userid: new ObjectID(userid)
                }
              },
              {
                $count: "count"
              }
            ],
            images: [
              {
                $match: {
                  userid: new ObjectID(userid)
                }
              },
              {
                $sort: {
                  created: -1
                }
              },
              {
                $skip: new Int32(imgPerPage * (page - 1))
              },
              {
                $limit: new Int32(imgPerPage)
              },
              {
                $lookup: {
                  from: "omg-img-users",
                  localField: "userid",
                  foreignField: "_id",
                  as: "user"
                }
              },
              {
                $replaceRoot: {
                  newRoot: {
                    $mergeObjects: [
                      {
                        $arrayElemAt: ["$user", 0]
                      },
                      "$$ROOT"
                    ]
                  }
                }
              },
              {
                $project: {
                  user: 0,
                  created_on: 0,
                  id: 0
                }
              },
              {
                $project: {
                  avatar: "$photo",
                  userid: "$userid",
                  username: "$name",
                  imageid: "$_id",
                  url: "$data.url",
                  urlmedium: {
                    $ifNull: ["$data.medium.url", "$data.url"]
                  },
                  _id: 0
                }
              }
            ]
          }
        }
      ];
    } else {
      return [
        {
          $facet: {
            numimages: [
              {
                $count: "count"
              }
            ],
            images: [
              {
                $sort: {
                  created: -1
                }
              },
              {
                $skip: new Int32(imgPerPage * (page - 1))
              },
              {
                $limit: new Int32(imgPerPage)
              },
              {
                $lookup: {
                  from: "omg-img-users",
                  localField: "userid",
                  foreignField: "_id",
                  as: "user"
                }
              },
              {
                $replaceRoot: {
                  newRoot: {
                    $mergeObjects: [
                      {
                        $arrayElemAt: ["$user", 0]
                      },
                      "$$ROOT"
                    ]
                  }
                }
              },
              {
                $project: {
                  user: 0,
                  created_on: 0,
                  id: 0
                }
              },
              {
                $project: {
                  avatar: "$photo",
                  userid: "$userid",
                  username: "$name",
                  imageid: "$_id",
                  url: "$data.url",
                  urlmedium: {
                    $ifNull: ["$data.medium.url", "$data.url"]
                  },
                  _id: 0
                }
              }
            ]
          }
        }
      ];
    }
  }

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }

  function renderContent(
    req,
    res,
    imgPerPage,
    pageName,
    pageTemplate,
    userid,
    username = 0
  ) {
    if (req.query.page) {
      if (Number(req.query.page) < 1) {
        res
          .status(404)
          .type("text")
          .send("Not Found");
      } else {
        db.db()
          .collection("omg-img-images")
          .aggregate(
            createPipeline(
              imgPerPage,
              Math.round(Number(req.query.page)),
              userid
            )
          )
          .toArray((err, doc) => {
            if (err) {
              console.log(err);
              res.json(err);
            } else {
              if (
                Math.ceil(doc[0].numimages[0].count / imgPerPage) <
                Math.round(Number(req.query.page))
              ) {//if requested page is greater than the number of pages
                res
                  .status(404)
                  .type("text")
                  .send("Not Found");
              } else {
                res.render(process.cwd() + pageTemplate, {
                  authenticated: req.isAuthenticated(),
                  currentpage: pageName,
                  images: Array.from(doc[0].images),
                  currentpagenum: Math.round(Number(req.query.page)),
                  numpages: Math.ceil(doc[0].numimages[0].count / imgPerPage),
                  username: username ? username : ""
                });
              }
            }
          });
      }
    } else {//render page 1
      db.db()
        .collection("omg-img-images")
        .aggregate(createPipeline(imgPerPage, 1, userid))
        .toArray((err, doc) => {
          if (err) {
            console.log(err);
            res.json(err);
          } else {
            res.render(process.cwd() + pageTemplate, {
              authenticated: req.isAuthenticated(),
              currentpage: pageName,
              images: Array.from(doc[0].images),
              currentpagenum: 1,
              numpages: Math.ceil(doc[0].numimages[0].count / imgPerPage),
              username: username ? username : ""
            });
          }
        });
    }
  }

  app.get("/", (req, res) => {
    renderContent(req, res, 7, "/", "/views/main.pug", 0);
  });

  app.get("/profile", ensureAuthenticated, (req, res) => {
    renderContent(req, res, 7, "/profile", "/views/profile.pug", req.user._id);
  });

  app.get("/user/:userid", (req, res) => {
    db.db()
      .collection("omg-img-users")
      .findOne({ _id: ObjectID(req.params.userid) }, (err, result) => {
        if (err) {
          res.json("Error");
        } else if (!result) {
          res.json("User not found");
        } else {
          renderContent(
            req,
            res,
            7,
            "/user/" + req.params.userid,
            "/views/user.pug",
            req.params.userid,
            result.name
          );
        }
      });
  });

  function postToImgHosting(image, req, res) {
    let form = new FormData();
    form.append("key", process.env.IMGBB_KEY);
    form.append("image", image);
    axios({
      method: "post",
      url: "https://api.imgbb.com/1/upload",
      headers: form.getHeaders(),
      data: form
    })
      .then(response => {
        if (response.status == 200) {
          db.db()
            .collection("omg-img-images")
            .insertOne(
              {
                userid: req.user._id,
                data: response.data.data,
                created: new Date()
              },
              (err, result) => {
                if (err) {
                  res.json("Error");
                } else {
                  res.json("OK");
                }
              }
            );
        } else {
          res.json("Error");
        }
      })
      .catch(error => {
        console.log(error);
        res.json(error);
      });
  }

  app.post("/image-upload", ensureAuthenticated, (req, res) => {
    if (req.body.url) {
      const urlRegex = RegExp("^https://.*");
      if (!urlRegex.test(req.body.url)) {
        res.json("Error. Wrong URL.");
      } else {
        postToImgHosting(req.body.url, req, res);
      }
    } else if (req.files) {
      if (Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
      let imageToUpload = req.files.file;
      postToImgHosting(imageToUpload.data.toString("base64"), req, res);
    }
  });

  app.post("/delete-image", ensureAuthenticated, (req, res) => {
    db.db()
      .collection("omg-img-images")
      .findOneAndDelete(
        { _id: ObjectID(req.body.imageid), userid: ObjectID(req.user._id) },
        (err, result) => {
          if (err) {
            res.json("Error");
          } else if(!result.value) {
            res.json("Image not found");
          } else {
            res.json("OK");
          }
        }
      );
  });

  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.route("/auth/github").get(passport.authenticate("github"));

  app
    .route("/auth/github/callback")
    .get(
      passport.authenticate("github", { failureRedirect: "/" }),
      (req, res) => {
        console.log(req.user);
        res.redirect("/profile");
      }
    );

  app.use((req, res, next) => {
    res
      .status(404)
      .type("text")
      .send("Not Found");
  });

  const listener = app.listen(process.env.PORT, () => {
    console.log("Your app is listening on port " + listener.address().port);
  });
};
