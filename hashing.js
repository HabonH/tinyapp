const bcrypt = require('bcryptjs');

const password = "purple-monkey-dinosaur"; // found in the req.params object

const hashedPassword = bcrypt.hashSync(password, 10);


