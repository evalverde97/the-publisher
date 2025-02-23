// server/server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const snoowrap = require('snoowrap');
const passport = require('passport');
const RedditStrategy = require('passport-reddit').Strategy;

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Configuración de Passport para Reddit OAuth2
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new RedditStrategy({
    clientID: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    callbackURL: process.env.REDDIT_CALLBACK_URL,
    scope: ['identity', 'submit', 'read']
  },
  function(accessToken, refreshToken, profile, done) {
    // Guardamos tokens y perfil en el objeto user
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    return done(null, profile);
  }
));

// Ruta para iniciar sesión con Reddit
app.get('/auth/reddit', passport.authenticate('reddit'));

// Callback de OAuth
app.get('/auth/reddit/callback', passport.authenticate('reddit', { failureRedirect: '/' }),
  (req, res) => {
    // Autenticación exitosa: redirige a la aplicación (puede ser el dashboard)
    res.redirect('/');
  }
);

// Ruta para cerrar sesión
app.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Middleware para verificar autenticación
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.status(401).json({ error: 'Usuario no autenticado' });
}

// Endpoint para obtener el usuario actual (para el frontend)
app.get('/api/current_user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: { name: req.user.name, id: req.user.id } });
  } else {
    res.json({ user: null });
  }
});

// Almacenamiento temporal en memoria para publicaciones programadas
let scheduledPosts = [];

// Endpoint para programar una publicación (requiere autenticación)
app.post('/api/posts', ensureAuthenticated, (req, res) => {
  const { title, text, subreddits, scheduleTime } = req.body;
  if (!title || !text || !subreddits || !scheduleTime) {
    return res.status(400).json({ error: 'Faltan datos requeridos.' });
  }
  
  const post = {
    title,
    text,
    subreddits, // Se espera un arreglo de strings
    scheduleTime,
    posted: false,
    redditUser: req.user  // Se guarda la información del usuario autenticado
  };
  
  scheduledPosts.push(post);
  res.json({ message: 'Publicación programada correctamente', post });
});

// Cron job: verifica cada minuto si es hora de publicar
cron.schedule('* * * * *', async () => {
  const now = new Date();
  scheduledPosts.forEach(async (post) => {
    if (!post.posted && new Date(post.scheduleTime) <= now) {
      const redditUser = post.redditUser;
      // Crea una instancia de snoowrap utilizando el token almacenado
      const r = new snoowrap({
        userAgent: 'ThePublisher/1.0',
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        refreshToken: redditUser.refreshToken,
        accessToken: redditUser.accessToken
      });
      
      for (const subreddit of post.subreddits) {
        try {
          await r.getSubreddit(subreddit).submitSelfpost({
            title: post.title,
            text: post.text
          });
          console.log(`Publicado en r/${subreddit}`);
        } catch (error) {
          console.error(`Error al publicar en r/${subreddit}:`, error);
        }
      }
      post.posted = true;
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
