const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const _ = require('underscore');

let LeadersModel = {};

const setName1 = name1 => _.escape(name1).trim();
const setName2 = name2 => _.escape(name2).trim();
const setName3 = name3 => _.escape(name3).trim();

const LeadersSchema = new mongoose.Schema({
  name1: {
    type: String,
    required: false,
    trim: true,
    set: setName1,
  },

  firstPlace: {
    type: Number,
    required: false,
    trim: true,
  },

  name2: {
    type: String,
    required: false,
    trim: true,
    set: setName2,
  },

  secondPlace: {
    type: Number,
    required: false,
    trim: true,
  },

  name3: {
    type: String,
    required: false,
    trim: true,
    set: setName3,
  },

  thirdPlace: {
    type: Number,
    required: false,
    trim: true,
  },

  createdData: {
    type: Date,
    default: Date.now,
  },
});

LeadersSchema.statics.toAPI = doc => ({
  name1: doc.name1,
  firstPlace: doc.firstPlace,
  name2: doc.name2,
  secondPlace: doc.secondPlace,
  name3: doc.name3,
  thirdPlace: doc.thirdPlace,
});

LeadersModel = mongoose.model('Leaders', LeadersSchema);

module.exports.LeadersModel = LeadersModel;
module.exports.LeadersSchema = LeadersSchema;
