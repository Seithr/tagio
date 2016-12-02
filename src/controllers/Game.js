// const models = require('../models');

const playGame = (req, res) => res.render('app', { csrfToken: req.csrfToken() });

module.exports.play = playGame;
