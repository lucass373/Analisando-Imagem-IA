import express from 'express';
import bodyParser from 'body-parser';
import measureRoutes from './routes/measureRoutes';


const app = express();
const port = 3000;
//carregar variaveis .env


app.use(bodyParser.json());
app.use('/', measureRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
