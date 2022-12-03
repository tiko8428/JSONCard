class Users {
  constructor(props) {
    const { pass, name, rol, key } = props;
    this.pass = pass;
    this.name = name;
    this.rol = rol;
    this.key = key;

  }
}

const users = [];

users.push(new Users({
  rol: "admin",
  key: "admin-test",
  pass: "karen_admin",
  name: "Karen"
}));

users.push(new Users({
  name: "user",
  rol: "translate",
  key: "user-test",
  pass: "user"
}));

module.exports = { users }
