const sqlite3 = require('sqlite3').verbose();

// Open the database
let db = new sqlite3.Database('./state.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the state database.');
});

// Function to update the last processed block number for Hive
const updateLastProcessedBlock = (newBlockNumber) => {
  const sql = `UPDATE state SET last_block_num = ? WHERE chain = 'hive'`;

  db.run(sql, [newBlockNumber], function(err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Row(s) updated: ${this.changes}`);
  });
};

// Call the function with the new block number
updateLastProcessedBlock(86163353);

// Close the database
db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Closed the database connection.');
});
