const adminUser = {
  "name": "Karen",
  "pass": "karen",
  "key": "testKey",
  "rol": "admin"
};

const laval = [
  {
    label: 'A1',
    value: 'A1',
  },
  {
    label: 'A2',
    value: 'A2',
  },
  {
    label: 'B1',
    value: 'B1',
  },
  {
    label: 'B2',
    value: 'B2',
  },
  {
    label: 'C1',
    value: 'C1',
  },
];


const language = [
  {
    label: 'de',
    value: 'de',
  },
  {
    label: 'ua',
    value: 'ua',
  },
  {
    label: 'ru',
    value: 'ru',
  },
  {
    label: 'en',
    value: 'en',
  },
];



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

module.exports = { users, adminUser }
