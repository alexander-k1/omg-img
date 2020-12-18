"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const ObjectID = require("mongodb").ObjectID;
const mongo = require("mongodb").MongoClient;
const GitHubStrategy = require("passport-github").Strategy;
const app = express();
const MongoStore = require("connect-mongo")(session);

module.exports = function(app, db) {
  app.use(
    session({
      store: new MongoStore({ url: process.env.DATABASE }),
      secret: process.env.SESSION_SECRET,
      resave: true,
      saveUninitialized: true
    })
  );

  app.use(passport.initialize());

  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    db.db()
      .collection("omg-img-users")
      .findOne({ _id: new ObjectID(id) }, (err, doc) => {
        done(null, doc);
      });
  });

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://agate-selective-rainstorm.glitch.me/auth/github/callback"
      },
      function(accessToken, refreshToken, profile, cb) {
        console.log(profile);
        db.db()
          .collection("omg-img-users")
          .findOneAndUpdate(
            { id: profile.id },
            {
              $setOnInsert: {
                id: profile.id,
                name: profile.displayName || "Github user",
                photo: profile.photos ? profile.photos[0].value : "",
                created_on: new Date()
              }
            },
            { upsert: true},
            (err, doc) => {
              return cb(null, doc.value);
            }
          );
      }
    )
  );
};
