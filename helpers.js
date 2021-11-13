const bcrypt = require('bcryptjs');

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)

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

function generateRandomString() {
  let newID = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);;
  return newID;
}


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

const getUserByEmail = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  }
  return null;
};

module.exports = { getUserByEmail, urlDatabase, users, urlsForUser, generateRandomString };
