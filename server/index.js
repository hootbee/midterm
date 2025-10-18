
const express = require('express');
const app = express();
const port = 3001; // 프론트엔드와 다른 포트 사용

app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
