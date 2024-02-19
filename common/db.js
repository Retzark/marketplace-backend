const mongoose = require('mongoose');
const config = require('./config');

const main = async () => {
  let connection;

  try {
    connection = await mongoose.connect(config.MONGODB);
  } catch (e) {
    console.log(e.message);
  }

  return connection;
};

mongoose.connection.on('connected', () => {
  console.log('Database is has been connected!');
});

mongoose.connection.on('error', (e) => {
  console.log(e.message);
});

module.exports = main();
