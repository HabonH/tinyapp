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
    password: bcrypt.hashSync("123", 10)

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
  const userUrls = {};

  for (const shortURL in urlDatabase) {

    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }

  return userUrls;
};

const getUserByEmail = (email) => {
  for (const user in users) {

    if (users[user].email === email) {
      return users[user];
    }
  }

  return null;
};

module.exports = { getUserByEmail, urlDatabase, users, urlsForUser, generateRandomString };
