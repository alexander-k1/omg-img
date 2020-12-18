"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const ObjectID = require("mongodb").ObjectID;
const mongo = require("mongodb").MongoClient;
const app = express();
const MongoStore = require("connect-mongo")(session);
const routes = require('./routes.js');
const auth = require('./auth.js');


app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");

mongo.connect(process.env.DATABASE, (err, db) => {
  if(err) {
    console.log('Database error: ' + err);
  } else {
    auth(app, db);
    routes(app, db);
    console.log('Successful database connection');
  }
})


