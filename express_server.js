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
    password: "123"
  }
};


const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }
};

const findUserByEmail = (userEmail) => {          // Email helper function, to see if a user has existing email registered
  for (const key in users) {
    if (users[key].email === userEmail) {
      return users[key];
    }
  }
  return null;
};

// --- Generates a random alphanumeric string
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

//--- Allows clients to create a shortURL if they are logged in, then redirects them to that new shortURL page after adding longURL + userID to urlDatabase
app.post("/urls", (req, res) => {
  // console.log("req.body---> ", req.body);  // Log the POST request body to the console
  if (!users[req.cookies.user_id]) {
    res.redirect("/login");
  } else if (users[req.cookies.user_id]) {
    const newShortURL = generateRandomString();
    const { longURL } = req.body;
    urlDatabase[newShortURL] = { longURL, userID: req.cookies.user_id };

    // console.log("shortURL--> ", newShortURL);
    // console.log("longURL--> ", longURL);
    // console.log("Updated URL database ", urlDatabase)

    res.redirect(`/urls/${newShortURL}`);
  }
});

const urlsForUser = (id) => {
  // Take urlDatabase and return entries created by the user
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      // console.log("shortURL --> ", shortURL);
      // console.log("urlDatabase[shortURL] --> ", urlDatabase[shortURL]);
      // console.log("userUrls before --> ", userUrls);
      userUrls[shortURL] = urlDatabase[shortURL]; //--- userUrls[shortURL] is being added into urlDatabase with the shortURL the user created
      // console.log("userUrls AFTER --> ", userUrls);

    }
  }
  return userUrls;
};

// --- Allows clients to view existing shortURL and longURL. *** Can't edit and can
app.get("/urls", (req, res) => {
  if (!users[req.cookies.user_id]) {
    res.cookie("error", "Please login or register to access TinyApp");
    res.redirect("/login");
  } else {
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: urlsForUser(req.cookies.user_id)
  };
  // console.log("urlDatabase --->", urlDatabase)
  res.render("urls_index", templateVars);
}
});

// --- Takes client to url/new page but must be logged in in order to create new URL
app.get("/urls/new", (req, res) => {
  // const userID = req.cookies.user_id; --- don't remove these comments, they help for self readibility
  // const user = users[userID];
  // const templateVars = {
  //   user,
  // };
  if (!users[req.cookies.user_id]) {
    res.cookie("error", "Please login or register to create a new URL");
    res.redirect("/login");
  } else if (users[req.cookies.user_id]) {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    res.render("urls_new", templateVars);
  }
});

// --- Redirects client to existing longURL via shortURL link *** longURL not working
app.get("/u/:shortURL", (req, res) => {
  // if the user is logged in, they can have access to their urls
  
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  // console.log("shortURL ---> ", shortURL)
  // console.log("longURL ---> ", longURL);
  res.redirect(longURL);
});

// --- Allows clients to view shortURLs with assigned longURL. *** longURL not being displayed in urls_shows & url not dis
app.get("/urls/:shortURL", (req, res) => {
  
  
  const shortURL = req.params.shortURL;
  // console.log("shortURL variable ---> ", shortURL);
  const longURL = urlDatabase[shortURL].longURL;
  const userID = urlDatabase[shortURL].userID;
  // console.log("longUrl ---> ", longURL);
  const templateVars = { user: users[req.cookies.user_id], shortURL: shortURL, longURL: longURL, userID: userID };
  res.render("urls_show", templateVars);
});


// --- Allows clients to delete existing shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!users[req.cookies.user_id]) {
    res.cookie("error", "Please login to delete URL");
    res.redirect("/login");

  } else if (users[req.cookies.user_id]) {
    const shortURL = req.params.shortURL;
    // const longURL= urlDatabase[req.params.shortURL];
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

// --- Allows clients create a new shortURL with long URL, then redirect to /urls page
app.post("/urls/:shortURL", (req, res) => { //--------------Not editing existing url
  if (!users[req.cookies.user_id]) {
    res.cookie("error", "Please login to edit URL");
    res.redirect("/login");

  } else if (users[req.cookies.user_id]) {
    const shortURL = req.params.shortURL;
    const longURL = urlDatabase[shortURL].longURL;
    urlDatabase[shortURL].longURL = longURL;
    res.redirect("/urls");

  }
});

// --- Allows clients to get/read to the login page 
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    email: req.cookies.email,
    error_msg: req.cookies.error
  };
  res.clearCookie("error");
  res.render("urls_login", templateVars);
});


// --- Allows clients to send post requests to login, as long as email and password exists and matches in users database
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === '' || password === '') {
    return res.status(400).send("To login, please provide your e-mail and password");
  }
  const user = findUserByEmail(email);
  if (!user) {
    return res.status(403).send(`User associated with ${email} doesn't exist, please register`);

  } else if (user) {
    // console.log("User does exist ---> ", user);
    // I need to compare if user's password matches with the req.body.password
    if (user.password === password) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      return res.status(403).send("Invalid password");
    }
  }
});

// --- Allows clients to log out and it clears cookies upon logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// --- Allows clients to view registration page 
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    urls: urlDatabase
  };
  res.render("urls_register", templateVars);
});

// --- Allows clients to register accurately according to conditions
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  const newUser = {
    id: id,
    email: email,
    password: password
  };

  if (email === '' || password === '') {
    return res.status(400).send("To register, please provide your e-mail and password");
  }

  const user = findUserByEmail(email);
  if (user) {
    return res.status(400).send(`User with ${email} is already registered`);
  } else {
    users[newUser.id] = newUser;
    res.cookie('user_id', newUser.id);
    res.redirect("/urls");
  }
  // console.log("user_id --> ", user.id);
  // console.log("id --> ", id);
  // console.log("Did error get logged---> ", users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});