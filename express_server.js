const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const { getUserByEmail, urlDatabase, users, urlsForUser, generateRandomString } = require('./helpers');

const app = express();
const PORT = 8080;

app.use(cookieSession({ name: 'session', keys: ['key1', 'key2'] }));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");



app.get("/", (req, res) => {

  const user = users[req.session.user_id];
  const urls = urlsForUser(req.session.user_id);

  if (!user) {
    res.redirect("/login");
  }

  if (user) {
    const templateVars = { user, urls };
    res.render("urls_index", templateVars);
  }
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls", (req, res) => {

  const user = users[req.session.user_id];
  if (!user) {
    return res.status(400).send("To access TinyApp, please <a href= '/login'> login </a> or <a href= '/register'> register </a>");
  }

  const urls = urlsForUser(req.session.user_id);
  const templateVars = { user, urls };

  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];

  if (!user) {
    res.redirect("/login");
    return res.status(400).send("Please login or register to create a new URL");

  }
  if (user) {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
});


app.get("/u/:shortURL", (req, res) => {

  const shortURL = req.params.shortURL;
  const validShortURL = urlDatabase[shortURL];
  if(!validShortURL){
    return res.status(400).send("Sorry, there is no longURL associated to the shortURL provided");
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});


app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  const shortURL = req.params.shortURL;
  const urlDB = urlDatabase[req.params.shortURL];
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const userID = urlDatabase[req.params.shortURL].userID;

  if (!urlDB) {
    res.status(400).send("The short URL you've entered doesn't match with an existing long URL.");
  }

  if (userID !== req.session.user_id) {
    return res.status(400).send("Sorry, you're not authorized to view or edit this URL.");
  }

  const templateVars = { shortURL, longURL, userID, user };
  res.render("urls_show", templateVars);

});


app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  const email = req.session.email;

  if (user) {
    res.redirect("/urls");
  }

  const templateVars = { user, email };
  res.render("urls_login", templateVars);
});


app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  const urls = urlDatabase;

  const templateVars = { user, urls };
  res.render("urls_register", templateVars);
});


//----------------------------Below are app.POST--------------------------------------------------------


app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];
  const newShortURL = generateRandomString();
  const userID = req.session.user_id;
  const { longURL } = req.body;

  if (!user) {
    return res.status(400).send("You must login to create a shortURL");
  }

  urlDatabase[newShortURL] = { longURL, userID };
  res.redirect(`/urls/${newShortURL}`);

});


app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;

  urlDatabase[shortURL].longURL = longURL;

  res.redirect("/urls");
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id];
  const shortURL = req.params.shortURL;

  if (!user) {
    res.redirect("/login");
    return res.status(400).send("If you're the owner of this URL login to delete it.");
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");

});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("To login, please provide your e-mail and password");
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(403).send(`User associated with ${email} doesn't exist, please <a href= '/register'> register </a>`);

  }
 
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("You've entered an invalid password");
  }

  if (bcrypt.compareSync(password, user.password)) {
    // res.cookie("user_id", user.id);
    req.session.user_id = user.id;
    res.redirect("/urls");
  }


});


app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("To register, please provide your e-mail and password");
  }

  const user = getUserByEmail(email);
  if (user) {
    return res.status(400).send(`User with ${email} is already registered`);
  }

  if (!user) {
    const newUser = { id, email, password: hashedPassword };
    users[newUser.id] = newUser;

    req.session.user_id = newUser.id;
    res.redirect("/urls");
  }
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

