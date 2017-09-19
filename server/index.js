const app = require('./app.js');
const db = require('./db');
const port = 4568;

app.listen(port, () => {
  console.log(`Shortly is listening on ${port}`);
});
