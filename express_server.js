const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const { response } = require("express");

const app = express();
const PORT = 8080;
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const findUserByEmail = (email) => {          // Email helper function, to see if a user has existing email registered
  for (key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return response.sendStatus(400);
};



function generateRandomString() {
  let newID = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);;
  return newID;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const newShortURL = generateRandomString();
  // console.log(newShortURL);
  urlDatabase[newShortURL] = req.body.longURL;
  // console.log(urlDatabase);
  res.redirect(`/urls/${newShortURL}`);
});


app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  // const userID = req.cookies.user_id; --- don't remove these comments, they help for self readibility
  // const user = users[userID];
  // const templateVars = {
  //   user,
  // };
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  // console.log("Req param result, ", req.params); 
  const templateVars = { user: users[req.cookies.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  // const longURL= urlDatabase[req.params.shortURL];
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  // console.log("req.body--> ", username);
  res.cookie("username", username);

  res.redirect("/urls");

});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: urlDatabase
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString();
  if (email || password === "") {
    return response.sendStatus(400);
  }

  const user = {
    id: id,
    email: email,
    password: password
  };
  users[user.id] = user;
  // console.log("user_id --> ", user.id);
  // console.log("id --> ", id);

  res.cookie('user_id', user.id);
  console.log("user in users object w/ user_id cookie value --> ", users["user.id"]);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
