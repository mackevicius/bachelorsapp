const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const axios = require('axios');
const uuidv4 = require('uuid').v4;
var cors = require('cors');
var SpotifyWebApi = require('spotify-web-api-node');
const bodyParser = require('body-parser');
const cookies = require('cookie-parser');
const querystring = require('querystring');
const SpotifyStrategy = require('passport-spotify').Strategy;
const passport = require('passport');
const session = require('express-session');

const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { error } = require('console');
const {
  queryContainer,
  createFamilyItem,
  replaceFamilyItem,
  deleteFamilyItem,
  uploadInfo,
  validateTracks,
} = require('./dbIndex');

dotenv.config();

var app = express();

// Spinning the http server and the WebSocket server.
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

const generateRandomString = function (length) {
  var text = '';
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const getRedirectUri = () => {
  if (process.env.NODE_ENV === 'development')
    return process.env.REDIRECT_URI_DEV;
  else {
    return process.env.REDIRECT_URI_PROD;
  }
};

const getCallbackRedirectUri = () => {
  if (process.env.NODE_ENV === 'development')
    return process.env.CALLBACK_REDIRECT_URL_DEV;
  else {
    return process.env.CALLBACK_REDIRECT_URL_PROD;
  }
};

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: getRedirectUri(),
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, expires_in, profile, done) => {
      const user = {
        accessToken,
        refreshToken,
        expires_in,
        profile,
      };

      process.nextTick(() => {
        done(null, user);
      });
    }
  )
);
app.use(
  cors({
    credentials: true,
    origin: [
      'http://localhost:3000',
      'https://gray-forest-0b9a13e03.2.azurestaticapps.net',
    ],
  })
);

app.use(cookies());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'SPOTIFY_BLABLA',
    resave: true,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

router.use((req, res, next) => {
  const refreshToken = req.user?.refreshToken;
  const access_token = req.user?.accessToken;

  if (refreshToken) {
    const spotifyApi = new SpotifyWebApi({
      redirectUri: getRedirectUri(),
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken,
    });
    spotifyApi
      .refreshAccessToken()
      .then((data) => {
        req.user.accessToken = data.body.access_token;
        req.user.expires_in = data.body.expires_in;
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(400);
      });
  }

  next();
});

router.get(
  '/login',
  passport.authenticate('spotify', {
    scope: [
      'user-read-private',
      'user-read-email',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
    ],
    showDialog: true,
  }),
  (req, res) => {
    res.status(200).send(req.user);
  }
);

router.get(
  '/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  (req, res) => {
    res.cookie('lopas', req.user);
    res.cookie('duhas', 'hei');
    req.session.user = req.user;
    res.redirect(getCallbackRedirectUri());
  }
);

router.get('/getPlaylists', (req, res) => {
  res.cookie('daunas', 'ajaj');
  res.status(400).json({
    requser: req.user,
    lolsessinas: req.session,
    reqsessionuser: req.session.user,
    cookies: req.cookies,
  });
  if (!req.user) {
    // res.status(400).send('loggedOut');
  } else {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    });
    spotifyApi
      .getUserPlaylists('21y65ubkr6wutgxvdnj6f333a', {})
      .then((response) => {
        res.send(response.body.items);
      })
      .catch((err) => {
        res.send(err);
      });
  }
});

// app.get('/getPlaylistTracks', (req, res) => {
//   if (!req.user) {
//     res.status(400).send('loggedOut');
//   } else {
//     const spotifyApi = new SpotifyWebApi({
//       clientId: process.env.CLIENT_ID,
//       clientSecret: process.env.CLIENT_SECRET,
//       accessToken: req.user.accessToken,
//       refreshToken: req.user.refreshToken,
//     });
//     spotifyApi
//       .getPlaylistTracks(req.query.id)
//       .then((response) => {
//         res.send(response.body);
//       })
//       .catch((err) => {
//         res.send(err);
//       });
//   }
// });
router.get('/getPlaylistTracks', (req, res) => {
  if (!req.user) {
    res.status(400).send('loggedOut');
  } else {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    });
    spotifyApi
      .getPlaylistTracks(req.query.id)
      .then((response) => {
        validateTracks(response.body.items, req.query.id)
          .then((validated) => {
            res.send(validated);
          })
          .catch((err) => {
            console.log(err);
            res.send(err);
          });
      })
      .catch((err) => {
        res.send(err);
      });
  }
});

// router.get('/searchPlaylist',(req,res)=>{
//   if (!req.user) {
//     res.status(400).send('loggedOut');
//   } else {
//     const spotifyApi = new SpotifyWebApi({
//       clientId: process.env.CLIENT_ID,
//       clientSecret: process.env.CLIENT_SECRET,
//       accessToken: req.user.accessToken,
//       refreshToken: req.user.refreshToken,
//     });
//     spotifyApi
//       .searchPlaylists(req.query.search)
//   }
// })

app.get('/items', (req, res) => {
  queryContainer()
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.sendStatus(400);
    });
});

app.get('/getPlaylistTrackInfo', (req, res) => {
  console.log('show', req.cookies);
  res.json({
    hooray: 's',
  });
});

app.post('/uploadPlaylistInfo', (req, res) => {
  // console.log(req.body);
  uploadInfo('playlists', req.body)
    .then((res) => {
      res.json('valio');
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post('/add', (req, res) => {
  createFamilyItem(req.body)
    .then((res) => {
      res.send(true);
    })
    .catch((err) => {
      res.send(err);
    });
});

app.post('/update', (req, res) => {
  replaceFamilyItem(req.body)
    .then((res) => {
      res.send(true);
    })
    .catch((err) => {
      res.send(err);
    });
});

app.post('/delete', (req, res) => {
  deleteFamilyItem(req.body)
    .then((res) => {
      res.send(true);
    })
    .catch((err) => {
      console.error(err);
      res.send(err.code);
    });
});

app.get('/kazkas', (req, res) => {
  console.log('gei');
  const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=2f260998e40849128281a3758eb04453&response_type=code&redirect_uri=${process.env.REDIRECT_URI_DEV}&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state`;
  res.redirect(AUTH_URL);
});

// I'm maintaining all active connections in this object
const clients = {};
// I'm maintaining all active users in this object
const users = {};
// The current editor content is maintained here.
let editorContent = null;
// User activity history.
let userActivity = [];

// Event types
const typesDef = {
  USER_EVENT: 'userevent',
  CONTENT_CHANGE: 'contentchange',
};

function broadcastMessage(json) {
  // We are sending the current data to all connected clients
  const data = JSON.stringify(json);
  for (let userId in clients) {
    let client = clients[userId];
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function handleMessage(message, userId) {
  const dataFromClient = JSON.parse(message.toString());
  const json = { type: dataFromClient.type };
  if (dataFromClient.type === typesDef.USER_EVENT) {
    users[userId] = dataFromClient;
    userActivity.push(`${dataFromClient.username} joined to edit the document`);
    json.data = { users, userActivity };
  } else if (dataFromClient.type === typesDef.CONTENT_CHANGE) {
    editorContent = dataFromClient.content;
    json.data = { users, editorContent, userActivity };
  }
  broadcastMessage(json);
}

function handleDisconnect(userId) {
  console.log(`${userId} disconnected.`);
  const json = { type: typesDef.USER_EVENT };
  const username = users[userId]?.username || userId;
  userActivity.push(`${username} left the document`);
  json.data = { users, userActivity };
  delete clients[userId];
  delete users[userId];
  broadcastMessage(json);
}

// A new client connection request received
wsServer.on('connection', function (connection) {
  // Generate a unique code for every user
  const userId = uuidv4();
  console.log('Recieved a new connection');

  // Store the new connection and handle messages
  clients[userId] = connection;
  // console.log(connection);
  // console.log(`${userId} connected.`);
  connection.on('message', (message) => {
    console.log(JSON.parse(message.toString()));
    handleMessage(message, userId);
  });
  // User disconnected
  connection.on('close', () => handleDisconnect(userId));
});

app.use('/', router);

server.listen(8080);
