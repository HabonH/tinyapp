const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const { response } = require("express");
const bcrypt = require('bcryptjs');
const e = require("express");


const app = express();
const PORT = 8080;
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("asd", 10)
    
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



// const findUserByEmail = (userEmail) => {          // Email helper function, to see if a user has existing email registered
//   for (const key in users) {
//     if (users[key].email === userEmail) { //// refactored below
//       return users[key];
//     }
//   }
//   return null;
// };

const getUserByEmail = (email, usersDatabase) => {
  for (const user in usersDatabase) {
    if (usersDatabase[user].email === email) {
      return users[user];
    }
  }
  return null;
};



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
// --- Generates a random alphanumeric string
function generateRandomString() {
  let newID = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);;
  return newID;
}
//----------------------------Below are app.GET--------------------------------------------------------
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



// --- Allows clients to view existing shortURL and longURL. 
app.get("/urls", (req, res) => {
  if (!users[req.session.user_id]) {
    return res.status(400).send("To access TinyApp, please <a href= '/login'> login </a> or <a href= '/register'> register </a>");

  }
  if (users[req.session.user_id]) {
    const templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id)
    };
    res.render("urls_index", templateVars);
    // console.log("urlDatabase --->", urlDatabase)
  }
});


// --- Takes client to url/new page but must be logged in in order to create new URL
app.get("/urls/new", (req, res) => {
  // const userID = req.session.user_id; --- don't remove these comments, they help for self readibility
  // const user = users[userID];
  // const templateVars = {
  //   user,
  // };
  if (!users[req.session.user_id]) {
    res.redirect("/login");
    return res.status(400).send("Please login or register to create a new URL");

  }
  if (users[req.session.user_id]) {
    const templateVars = {
      user: users[req.session.user_id]
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



// --- Allows clients to view shortURLs with assigned longURL.
app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {

    if (urlDatabase[req.params.shortURL].userID !== req.session.user_id) {
      return res.status(400).send("Sorry, you're not authorized to edit this URL.");
    }
    const templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      userID: urlDatabase[req.params.shortURL].userID,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("The short URL you've entered doesn't match with an existing long URL.");
  }

});


// --- Allows clients to get/read to the login page 
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    email: req.session.email,
    error_msg: req.session.error
  };
  res.clearCookie("error");
  res.render("urls_login", templateVars);
});



// --- Allows clients to view registration page 
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };
  res.render("urls_register", templateVars);
});


//----------------------------Below are app.POST--------------------------------------------------------



//--- Allows clients to create a shortURL if they are logged in, then redirects them to that new shortURL page after adding longURL + userID to urlDatabase
app.post("/urls", (req, res) => {
  // console.log("req.body---> ", req.body);  // Log the POST request body to the console
  if (!users[req.session.user_id]) {
    res.redirect("/login");
  } else if (users[req.session.user_id]) {
    const newShortURL = generateRandomString();
    const { longURL } = req.body;
    urlDatabase[newShortURL] = { longURL, userID: req.session.user_id };

    // console.log("shortURL--> ", newShortURL);
    // console.log("longURL--> ", longURL);
    console.log("Updated URL database ", urlDatabase);

    res.redirect(`/urls/${newShortURL}`);
  }
});



// --- Allows clients create a new shortURL with long URL, then redirect to /urls page
app.post("/urls/:shortURL", (req, res) => { //**HERE!!***Not editing existing url


  const shortURL = req.params.shortURL;
  console.log("shortURL ---> ", shortURL);
  const longURL = req.body.longURL;
  console.log("longURL --> ", longURL);
  urlDatabase[shortURL].longURL = longURL;
  console.log("UrlDatabase ---> ", urlDatabase);

  res.redirect("/urls");


});


// --- Allows clients to delete existing shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!users[req.session.user_id]) {
    res.redirect("/login");
    return res.status(400).send("Please login to delete URL");

  } else if (users[req.session.user_id]) {
    const shortURL = req.params.shortURL;
    // const longURL= urlDatabase[req.params.shortURL];
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});




// --- Allows clients to send post requests to login, as long as email and password exists and matches in users database
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("To login, please provide your e-mail and password");
  }
  
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send(`User associated with ${email} doesn't exist, please register`);

  }
  
  if (user) {
    // console.log("User does exist ---> ", user);
    // I need to compare if user's password matches with the req.body.password

    if (bcrypt.compareSync(password, user.password)) {
      // res.cookie("user_id", user.id);
      req.session.user_id = user.id;
      res.redirect("/urls");
    }
    console.log("Password input ---> ", password);
    console.log("Password of existing user ---> ", user.password);
    console.log("TRUUUE or false? ", bcrypt.compareSync(password, user.password))
  }
  
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Password doesn't match to this account");
  }
});



// --- Allows clients to register accurately according to conditions
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;



  if (!email || !password) {
    return res.status(400).send("To register, please provide your e-mail and password");
  }

  const user = getUserByEmail(email, users);

  if (user) {
    return res.status(400).send(`User with ${email} is already registered`);
  }

  // Hash user's password when registering
  if (!user) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id,
      email,
      password: hashedPassword
    };
    users[newUser.id] = newUser;
    // console.log("Users ---> ", users);
    // console.log("Compare passwords",bcrypt.compareSync(password, hashedPassword) )
    // res.cookie('user_id', newUser.id);
    req.session.user_id = newUser.id;

    res.redirect("/urls");
  }

  // console.log("user_id --> ", user.id);
  // console.log("id --> ", id);
  // console.log("Did error get logged---> ", users);
});


// --- Allows clients to log out and it clears cookies upon logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});