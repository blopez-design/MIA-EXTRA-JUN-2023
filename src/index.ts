import express from 'express';

const app = express();
const port = 3000;
app.use(express.json());
app.get('/hello', (req, res) => {
  res.send('Hell!');
});

app.listen(port, ()=> console.log('Start server on PORT ' + port));