const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const axios = require('axios');
const path = require('path');
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
const fs = require('fs');
const { error } = require('console');
const {
  validateTracks,
  postVote,
  getUserVotes,
  getPlaylists,
  addPlaylist,
} = require('./dbIndex');
const e = require('cors');

dotenv.config();

var app = express();

// Spinning the http server and the WebSocket server.
const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

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
      'https://www.spotifyplaylistvotingapp.xyz',
      'http://localhost:3000',
    ],
  })
);

app.use(cookies());

app.use(bodyParser.json({}));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // trust first proxy
}

const sessionConfig = {
  secret: 'SPOTIFY_BLABLA',
  resave: true,
  saveUninitialized: false,
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // must be 'none' to enable cross-site delivery
    secure: process.env.NODE_ENV === 'production', // must be true if sameSite='none'
  },
};

app.use(session(sessionConfig));

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
        res.sendStatus(400);
      });
  }

  next();
});

router.get(
  '/login',
  passport.authenticate('spotify', {
    scope: [
      'ugc-image-upload',
      'streaming',
      'user-read-private',
      'user-read-email',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
      'playlist-modify-public',
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
    wsServer.on('headers', function (headers) {
      headers.push('Set-Cookie: ' + 'userId=' + req.user.profile.id);
    });
    req.session.user = req.user;
    res.redirect(getCallbackRedirectUri());
  }
);

router.get('/getUserId', (req, res) => {
  if (req.user) {
    res.json(req.user.profile.id);
  }
  res.status(401).send('loggedOut');
});

router.get('/getPlaylists', (req, res) => {
  if (!req.user) {
    res.status(401).send('loggedOut');
  } else {
    getPlaylists()
      .then((playlists) => res.send(playlists))
      .catch((err) => {
        res.status(400).send('error');
      });
  }
});

router.get('/getToken', (req, res) => {
  if (!req.user) {
    res.status(401).send('loggedOut');
  } else {
    res.send(req.user.accessToken);
  }
});

router.post('/addPlaylist', (req, res) => {
  addPlaylist(
    req.body.playlistId,
    req.body.name,
    req.body.description,
    req.body.imageUrl
  )
    .then(() => {
      res.status(200).send(true);
    })
    .catch((err) => {
      if (err.code === 409) {
        res.status(401).send('alreadyExists');
      }
      res.status(500);
    });
});

router.post('/playlistPreview', (req, res) => {
  if (!req.user) {
    res.status(401).send('loggedOut');
  }
  {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    });

    spotifyApi
      .getMyDevices()
      .then((response) => {
        spotifyApi
          .play({
            device_id: response.body.devices[0].id,
            context_uri: `spotify:playlist:${req.body.id}`,
          })
          .then(() => res.send(200))
          .catch((err) => res.status(400).status('Couldnt play'));
      })
      .catch((err) => {
        res.status(400).send('noDevices');
      });
  }
});

router.get('/getPlaylistTracks', (req, res) => {
  if (!req.user) {
    res.status(401).send('loggedOut');
  } else {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    });

    spotifyApi
      .getPlaylistTracks(req.query.id, {
        limit: 50,
      })
      .then((response) => {
        validateTracks(response.body.items, req.query.id, req.user.profile.id)
          .then((validated) => {
            res.send(validated);
          })
          .catch((err) => {
            res.status(400).send('dbError');
          });
      })
      .catch((err) => {
        res.send(err);
      });
  }
});

function base64_encode(file) {
  return 'data:image/gif;base64,' + fs.readFileSync(file, 'base64');
}

router.post('/savePlaylist', (req, res) => {
  if (!req.user) {
    res.status(401).send('loggedOut');
  } else {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    });
    console.log(req.body.imageUrl);
    const base64str = base64_encode('./please.png').split(',')[1];

    spotifyApi
      .createPlaylist(req.body.name)
      .then((response1) => {
        spotifyApi
          .uploadCustomPlaylistCoverImage(response1.body.id, base64str)
          .then((response2) => {
            spotifyApi
              .addTracksToPlaylist(response1.body.id, req.body.tracks)
              .then(() => {
                console.log('heyy');
                res.status(200).send(true);
              })
              .catch(() => res.status(400).send('lo'));
          })
          .catch((err) => {
            console.log(err);
            res.status(400).send('s');
          });
      })
      .catch((err) => {
        res.status(400).send(err);
        console.log(err);
      });
  }
});

router.get('/getPlaylistInfo', (req, res) => {
  if (!req.user) {
    res.status(401).send('loggedOut');
  } else {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    });

    spotifyApi.getPlaylist(req.query.id).then((response) => {
      res.status(200).send(response);
    });
  }
});

router.get('/searchPlaylists', (req, res) => {
  if (!req.user) {
    res.status(401).send('loggedOut');
  } else {
    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken: req.user.accessToken,
      refreshToken: req.user.refreshToken,
    });
    spotifyApi
      .searchPlaylists(req.query.query, {
        limit: 10,
      })
      .then((response) => {
        res.send(response.body);
      })
      .catch((err) => {
        res.send(err);
      });
  }
});

router.get('/getUserVotes', (req, res) => {
  if (!req.user) {
    res.status(401).send('loggedOut');
  } else {
    getUserVotes(req.user.profile.id, req.query.id).then((response) => {
      res.send(response);
    });
  }
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
function sendErrorMessage(userId, err) {
  let client = clients[userId];
  client.send(
    JSON.stringify({
      type: 'error',
      err,
    })
  );
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
  const json = { type: typesDef.USER_EVENT };
  const username = users[userId]?.username || userId;
  userActivity.push(`${username} left the document`);
  json.data = { users, userActivity };
  delete clients[userId];
  delete users[userId];
  broadcastMessage(json);
}

// A new client connection request received

wsServer.on('connection', function (connection, req) {
  // Generate a unique code for every user
  const userId = uuidv4();
  // Store the new connection and handle messages
  clients[userId] = connection;

  connection.on('message', (message) => {
    const newMessage = JSON.parse(message.toString());
    if ((newMessage.type = 'contentchange')) {
      postVote(newMessage.content)
        .then(() => {
          handleMessage(message, userId);
        })
        .catch((err) => {
          sendErrorMessage(userId, err.message);
        });
    }
  });
  // User disconnected
  connection.on('close', () => handleDisconnect(userId));
});

app.use('/', router);

server.listen(8080);
