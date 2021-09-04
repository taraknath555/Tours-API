const dotenv = require('dotenv');
//Connecting to load Environment variables. must load before requiring app
//so that process.env should available to all the files
dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception, Shutting down...');
  process.exit(1);
});

const mongoose = require('mongoose');
const app = require('./app');

const port = process.env.PORT || 3000;
const DB = process.env.DATABASE.replace(
  'PASSWORD',
  process.env.DATABASE_PASSWORD
);

//Connecting to Database
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then((con) => {
    console.log('Database is connected successfully');
  });

//Starting Server
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Server started on port: ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection, Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
