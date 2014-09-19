(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */

var BASE_URL = location.host;

var c = require('./common');
var option = c.option;
var optionIdx = c.optionIdx;
var concat = c.concat;
var map = c.map;
var startsWith = c.startsWith;

var PlayListMixin = require('./PlayListMixin');

var SearchBox = require('./SearchBox.react');

Parse.initialize("B6xry2nLRUxSE4nxue6q4xzS1A2WmleBgY2UAZEY", "IeDF4F0c65lXnvgSDH1AiWguWKd6rt2DWbkD6EjE");

function makeNamePronounceable(name) {
  return name
    .replace(/^[ÁÀÂÄÅ]/, 'A')
    .replace(/[áàâäåª]/g, 'a')
    .replace(/^Æ/, 'Ae')
    .replace(/æ/g, 'ae')
    .replace(/^Ç/, 'C')
    .replace(/ç/g, 'c')
    .replace(/^Œ/, 'Ce')
    .replace(/œ/g, 'ce')
    .replace(/^[ÉÈÊË]/, 'E')
    .replace(/[éèêë]/g, 'e')
    .replace(/^[ÍÌÎÏ]/, 'I')
    .replace(/[íìîï]/g, 'i')
    .replace(/^Ñ/, 'N')
    .replace(/ñ/g, 'n')
    .replace(/^[ÓÒÔÖ]/, 'O')
    .replace(/[óòôöº]/g, 'o')
    .replace(/^ÚÙÛÜ/, 'U')
    .replace(/[úùûü]/g, 'u')
    .replace(/^Ý/, 'Y')
    .replace(/[ýÿ]/g, 'y')
    .replace(/^ß/, 'B')
    .replace(/ß/g, 'ss')
}

function getHiddenProp() {
  var prefixes = ['webkit', 'moz', 'ms', 'o'];

  // if 'hidden' is natively supported just return it
  if ('hidden' in document) return 'hidden';

  // otherwise loop over all the known prefixes until we find one
  for (var i = 0; i < prefixes.length; i++) {
    if ((prefixes[i] + 'Hidden') in document)
      return prefixes[i] + 'Hidden';
  }

  // otherwise it's not supported
  return null;
}

function isHidden() {
  var prop = getHiddenProp();
  if (!prop) return false;

  return document[prop];
}

var App = React.createClass({displayName: 'App',
  mixins: [PlayListMixin],

  getInitialState: function () {
    return {
      term: '',
      text: '',
      name: "Cell",
      race: "Gnome",
      class: "Rogue",
      error: false,
      loading: false
    }
  },

  componentDidMount: function () {
    if (location.search.trim() !== '') {
      this.parse(location.search);
    }

    // use the property name to generate the prefixed event name
    var visProp = getHiddenProp();
    if (visProp) {
      var evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
      document.addEventListener(evtname, this.visChange);
    }
  },

  componentDidUpdate: function () {
    if (!this.state.loading)
      this.refs["searchBox"].refs["input"].getDOMNode().focus();
  },

  visChange: function () {
    if (!isHidden()) {
      this.refs["searchBox"].refs["input"].getDOMNode().focus();
    }
  },

  parse: function (str) {
    return option(str)
      .then(queryString.parse)
      .then(this.validate)
      .then(function (data) {
        this.setState({
          name: makeNamePronounceable(data.name),
          class: data.class,
          race: data.race,
          term: '',
          loading: true
        });
        return JSON.parse(data.qs)
      }.bind(this))
      .then(function (qs) {
        return Parse.Cloud.run("quests", {
          questIds: qs
        });
      })
      .then(this.addAll, function rejected() {
        this.setState({
          loading: false,
          error: true
        });
      }.bind(this));
  },

  validate: function (data) {
    return (data.hasOwnProperty('name') &&
      data.hasOwnProperty('class') &&
      data.hasOwnProperty('race') &&
      data.hasOwnProperty('qs')) ?
      Parse.Promise.as(data) : Parse.Promise.error("Invalid data");
  },

  onInputChange: function (term) {
    this.setState({
      term: term
    });

    if (startsWith(term, BASE_URL)) {
      this.parse(term.split('?')[1]);
    }
  },

  onPlayClick: function () {
    var term = this.state.term;
    var questId;
    if (startsWith(term, BASE_URL)) {
      this.parse(term.split('?')[1])
    } else {
      questId = Number(term);
      if (isNaN(questId)) {
        this.setState({error: true});
      } else {

        this.setState({
          term: '',
          loading: true
        });

        Parse.Cloud.run('quest', {
          questId: questId
        }).then(this.add, function rejected() {
          this.setState({
            loading: false,
            error: true
          });
        }.bind(this));
      }
    }
  },

  onStopClick: function () {
    this.stop();
  },

  onPrevClick: function () {
    // TODO: prev
  },

  onNextClick: function () {
    // TODO: next
  },

  render: function () {
    var table = map(this.state.list, function (questId) {
      return (
        React.DOM.tr({key: questId}, 
          React.DOM.td(null, this.state.questTexts[questId].get("title"))
        ));
    }.bind(this));

    var searchBox = this.state.loading ?
      'Loading...' :
      SearchBox({ref: "searchBox", value: this.state.term, onChange: this.onInputChange, onSubmit: this.onPlayClick});

    return (
      React.DOM.div({className: "content"}, 
        React.DOM.div({className: "row"}, 
          React.DOM.div({className: "col-md-9"}, 
            React.DOM.h1(null, "WoW Quest Text Reader"), 
            searchBox, 
            React.DOM.button({onClick: this.onPlayClick}, "Play"), 
            React.DOM.button({onClick: this.onStopClick}, "Stop"), 
            React.DOM.button({onClick: this.onPrevClick}, "Prev"), 
            React.DOM.button({onClick: this.onNextClick}, "Next"), 
             this.state.error ? "Error..." : null, 
            React.DOM.div(null, 
              this.state.currentText
            )
          ), 
          React.DOM.div({className: "col-md-3"}, 
            React.DOM.dl({className: "dl-horizontal"}, 
              React.DOM.dt(null, "Name"), 
              React.DOM.dd(null, this.state.name), 
              React.DOM.dt(null, "Class"), 
              React.DOM.dd(null, this.state.class), 
              React.DOM.dt(null, "Race"), 
              React.DOM.dd(null, this.state.race)
            ), 
            React.DOM.table({className: "table"}, 
              React.DOM.tbody(null, 
                table
              )
            )
          )
        )
      ));
  }
});

document.addEventListener('DOMContentLoaded', function () {
  React.renderComponent(
    App(null),
    document.body
  );
});

},{"./PlayListMixin":2,"./SearchBox.react":3,"./common":4}],2:[function(require,module,exports){
var TIME_BETWEEN_QUEST_SPEAK = 1250;

var c = require('./common');
var option = c.option;
var optionIdx = c.optionIdx;
var concat = c.concat;
var map = c.map;
var startsWith = c.startsWith;

var PlayList = {
  getInitialState: function () {
    return {
      current: 0,
      list: [],
      questTexts: {},
      isPlaying: false,
      isStopped: false
    }
  },

  add: function (questText) {
    this.addAll([questText]);
  },

  addAll: function (questTexts) {
    var questIds = map(questTexts, function (questText) {
      var questId = questText.get("questId");
      this.state.questTexts[questId] = questText;
      return questId;
    }.bind(this));

    // TODO: deal with duplicates
    this.state.loading = false;
    this.state.error = false;
    this.state.list = concat(this.state.list, _.without(questIds, this.state.list));

    if (!this.state.isPlaying && this.state.current < this.state.list.length) {
      this.state.isPlaying = true;
      this.state.isStopped = false;
      this.play();
    }

    this.forceUpdate();
  },

  stop: function () {
    this.state.isStopped = true;
    this.state.isPlaying = false;
    speechSynthesis.cancel();
    this.forceUpdate();
  },

  play: function () {
    var questId = this.state.list[this.state.current];
    var questText = this.state.questTexts[questId];
    this.speak(questText)
      .then(function () {
        this.state.current++;
        if (this.state.current < this.state.list.length) {
          setTimeout(function () {
            this.play();
          }.bind(this), TIME_BETWEEN_QUEST_SPEAK);
        } else {
          this.state.isPlaying = false;
        }
        this.forceUpdate();
      }.bind(this));
  },

  speak: function (questText) {
    var text = questText.get('title') + '.\n' + (questText.get('text')
      .replace(/<race>/g, this.state.race)
      .replace(/<class>/g, this.state.class)
      .replace(/<name>/g, this.state.name)
      .replace(/<.*>/g, '')); // TODO: Read in a different voice

    this.setState({
      currentText: text
    });

    // TODO: split further for long sentences
    var chunks = text.split(/[.!?]\s/g).map(function (chunk) {
      return chunk.trim();
    });

    var p = new Parse.Promise();

    // What follows is a load of crap that works:
    var i = 0;
    var utts = chunks.map(function (chunk) {
      var utt = new SpeechSynthesisUtterance(chunk);
      utt.onend = function () {
        if (!this.isStopped) {
          i++;
          innerSpeak();
        } else {
          p.reject("Stopped");
        }
      }.bind(this);
      return utt;
    }, this);

    function innerSpeak() {
      var utt = utts[i];
      if (utt) {
        console.log(utt); //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.

        setTimeout(function () {
          speechSynthesis.speak(utt);
        }, 0);
      } else {
        p.resolve('Spoken');
      }
    }

    innerSpeak();

    return p;
  }
};

module.exports = PlayList;

},{"./common":4}],3:[function(require,module,exports){
/** @jsx React.DOM */
  
var c = require('./common');
var option = c.option;
var optionIdx = c.optionIdx;
var concat = c.concat;
var map = c.map;
var startsWith = c.startsWith;

var SearchBox = React.createClass({displayName: 'SearchBox',
  onChange: function (e) {
    if (this.props.onChange) {
      this.props.onChange(e.target.value);
    }
  },

  onKeyDown: function (e) {
    if (e.which === 13) {
      this.props.onSubmit(e.target.value);
    }
  },

  render: function () {
    return (
      React.DOM.input({
      type: "text", 
      min: "0", 
      placeholder: "Quest Id", 
      value: this.props.value, 
      ref: "input", 
      onChange: this.onChange, 
      onKeyDown: this.onKeyDown}
      ));
  }
});

module.exports = SearchBox;

},{"./common":4}],4:[function(require,module,exports){
function option(some, errorText) {
  return some ?
    Parse.Promise.as(some) :
    Parse.Promise.error(Error(errorText || 'None'));
}

function optionIdx(idx, errorText) {
  return (idx >= 0) ?
    Parse.Promise.as(idx) :
    Parse.Promise.error(Error(errorText || 'None'));
}

function concat(arr, arr2) {
  return arr ? arr.concat(arr2) : arr2;
}

function map(arr, f) {
  return arr ? arr.map(f) : arr;
}

function startsWith(base, str) {
  return base.slice(0, str.length) === str;
}

module.exports = {
  option: option,
  optionIdx: optionIdx,
  concat: concat,
  map: map,
  startsWith: startsWith
};

},{}]},{},[1]);
