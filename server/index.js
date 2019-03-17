require('dotenv').config({ path: 'variable.env' });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  useTLS: true,
  encryptionMasterKey: process.env.PUSHER_CHANNELS_ENCRYPTION_KEY,
});

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const titles = [];

app.post('/pusher/auth', function(req, res) {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

app.post('/feed', (req, res) => {
  const title = req.body.title;
  const body = req.body.body;

  if (title === undefined) {
    res
      .status(400)
      .send({ message: 'Please provide your post title', status: false });
    return;
  }

  if (body === undefined) {
    res
      .status(400)
      .send({ message: 'Please provide your post body', status: false });
    return;
  }

  if (title.length <= 5) {
    res.status(400).send({
      message: 'Post title should be more than 5 characters',
      status: false,
    });
    return;
  }

  if (body.length <= 6) {
    res.status(400).send({
      message: 'Post body should be more than 6 characters',
      status: false,
    });
    return;
  }

  const index = titles.findIndex(element => {
    return element === title;
  });

  if (index >= 0) {
    res
      .status(400)
      .send({ message: 'Post title already exists', status: false });
    return;
  }

  titles.push(title.trim());
  pusher.trigger('private-encrypted-realtime-feeds', 'posts', {
    title: title.trim(),
    body: body.trim(),
    time: new Date(),
  });

  res
    .status(200)
    .send({ message: 'Post was successfully created', status: true });
});

app.set('port', process.env.PORT || 5200);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running on port ${server.address().port}`);
});
