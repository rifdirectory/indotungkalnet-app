const bcrypt = require('bcryptjs');

const hash = '$2b$10$GRVKquqoNuh4a7AJeoYL9Oa.zuB3MJBFI8Zs5izCkD3CfTnsjHtEy';
const password = 'advance';

bcrypt.compare(password, hash).then(result => {
  console.log('Password "advance" matches hash:', result);
});
