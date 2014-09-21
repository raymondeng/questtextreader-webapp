(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */

var BASE_URL = 'http://' + location.host;

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
    .replace(/[áàâäå]/g, 'a')
    .replace(/^Æ/, 'Ae')
    .replace(/æ/g, 'ae')
    .replace(/^Ç/, 'C')
    .replace(/ç/g, 'c')
    .replace(/^[ÉÈÊË]/, 'E')
    .replace(/[éèêë]/g, 'e')
    .replace(/^[ÍÌÎÏ]/, 'I')
    .replace(/[íìîï]/g, 'i')
    .replace(/^Ñ/, 'N')
    .replace(/ñ/g, 'n')
    .replace(/^[ÓÒÔÖØ]/, 'O')
    .replace(/[óòôöø]/g, 'o')
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

var RemoteButton = React.createClass({displayName: 'RemoteButton',
  render: function () {
    return (
      React.DOM.button({id: "remote-" + this.props.id, className: "btn btn-default", onClick: this.props.onClick}, 
        React.DOM.span({className: "glyphicon glyphicon-" + this.props.icon})
      )
      );
  }
});

var Remote = React.createClass({displayName: 'Remote',
  render: function () {
    var middle = this.props.parent.state.isPlaying ?
      RemoteButton({id: "stop", icon: "stop", onClick: this.props.parent.onStopClick}) :
      RemoteButton({id: "play", icon: "play", onClick: this.props.parent.onPlayClick});

    return (
      React.DOM.div({id: "remote"}, 
        RemoteButton({id: "prev", icon: "backward", onClick: this.props.parent.onPrevClick}), 
        middle, 
        RemoteButton({id: "next", icon: "forward", onClick: this.props.parent.onNextClick})
      )
      );
  }
});

navigator.sayswho = (function () {
  var ua = navigator.userAgent, tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return 'IE ' + (tem[1] || '');
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\bOPR\/(\d+)/)
    if (tem != null) return 'Opera ' + tem[1];
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
  return M.join(' ');
})();

var App = React.createClass({displayName: 'App',
  mixins: [PlayListMixin],

  getInitialState: function () {
    return {
      term: '',
      name: "Name",
      race: "Race",
      class: "Class",
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
        var qs = JSON.parse(data.qs);
        return _.difference(qs, this.state.list);
      }.bind(this))
      .then(function (qs) {
        return qs.length > 0 ?
          Parse.Cloud.run("quests", {questIds: qs}) :
          Parse.Promise.error('No new quests');
      })
      .then(this.addAll, function rejected() {
        this.setState({
          term: '',
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

  onSubmit: function () {
    var term = this.state.term;
    var questId;
    if (startsWith(term, BASE_URL)) {
      this.parse(term.split('?')[1])
    } else {
      questId = Number(term);
      if (isNaN(questId)) {
        this.setState({error: true, term: ''});
      } else {
        this.readQuestId(questId);
      }
    }
  },

  readQuestId: function (questId) {
    if (this.state.list.indexOf(questId) === -1) {
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
  },

  onPlayClick: function () {
    PlayListMixin.play.call(this);
  },

  onStopClick: function () {
    PlayListMixin.stop.call(this);
  },

  onPrevClick: function () {
    PlayListMixin.prev.call(this);
  },

  onNextClick: function () {
    PlayListMixin.next.call(this);
  },

  createOnPlaylistClick: function (i) {
    return this.state.current !== i ? function () {
      this.jumpTo(i);
    }.bind(this) : null;
  },

  onSample: function () {
    this.readQuestId(9999);
  },

  render: function () {
    var table = map(this.state.list, function (questId, i) {
      return (
        React.DOM.tr({key: questId, className: this.state.current === i ? 'active' : '', onClick: this.createOnPlaylistClick(i)}, 
          React.DOM.td(null, this.state.questTexts[questId].get("title"))
        ));
    }.bind(this));

    var currentTitle, currentText;
    var currentQuestId = this.state.list[this.state.current];
    var currentQuestText = this.state.questTexts[currentQuestId];
    if (currentQuestText) {
      currentTitle = React.DOM.h2({className: this.state.currentSentence === 0 ? 'active' : ''}, currentQuestText.get('title'));
      currentText = this.prepareText(currentQuestText.get('text'))
        .split(/[.!?]\s/g)
        .map(function (sentence, i) {
          return React.DOM.span({className: this.state.currentSentence === (i + 1) ? 'active' : ''}, sentence, ". ");
        }, this);
    } else {
      currentTitle = React.DOM.h2({className: "active"}, "WoW Quest Text Reader");
      currentText =
        React.DOM.div(null, 
          React.DOM.span({className: "active"}, "Welcome! This web app can read WoW quest texts to you. "), 
          React.DOM.span({className: "active"}, 
            React.DOM.span(null, "If you haven't done so already, please install the "), 
            React.DOM.a({href: "#"}, "Quest Text Reader addon"), 
            React.DOM.span(null, ". ")
          ), 
          React.DOM.span({className: "active"}, "This addon will generate links that will tell this app what to read. "), 
          React.DOM.span({className: "active"}, 
            React.DOM.span(null, "You can also "), 
            React.DOM.a({onClick: this.onSample}, "listen to a sample"), 
            React.DOM.span(null, ". ")
          )
        );

    }

    var searchBox;
    if (this.state.loading) {
      searchBox = React.DOM.div({className: "loading"}, "Loading...");
    } else if (this.state.error) {
      searchBox = SearchBox({ref: "searchBox", placeholder: "Error...", value: this.state.term, onChange: this.onInputChange, onSubmit: this.onSubmit});
    } else {
      searchBox = SearchBox({ref: "searchBox", value: this.state.term, onChange: this.onInputChange, onSubmit: this.onSubmit});
    }

    return (
      React.DOM.div({className: "app"}, 
        React.DOM.div({className: "col-9"}, 
          React.DOM.h1(null, "WoW Quest Text Reader"), 
          React.DOM.div({id: "search-box"}, 
            searchBox
          ), 
          React.DOM.div({id: "current-text"}, 
            currentTitle, 
            currentText
          )
        ), 
        React.DOM.div({className: "col-3"}, 
          React.DOM.div({id: "remote-box"}, 
            Remote({parent: this})
          ), 
          React.DOM.div({id: "play-list"}, 
            React.DOM.table(null, 
              React.DOM.tbody(null, 
              table
              )
            )
          )
        ), 
        React.DOM.footer(null, 
          React.DOM.label({htmlFor: "name"}, "Name:"), 
          React.DOM.input({id: "name", ref: "name", type: "text", value: this.state.name, onChange: this.onNameChange}), 
          React.DOM.label({htmlFor: "race"}, "Race:"), 
          React.DOM.select({id: "race", ref: "race", value: this.state.race, onChange: this.onRaceChange}, 
            React.DOM.option(null, "Pandaren"), 
            React.DOM.option(null, "Worgen"), 
            React.DOM.option(null, "Goblin"), 
            React.DOM.option(null, "Draenei"), 
            React.DOM.option(null, "Blood Elf"), 
            React.DOM.option(null, "Dwarf"), 
            React.DOM.option(null, "Orc"), 
            React.DOM.option(null, "Gnome"), 
            React.DOM.option(null, "Tauren"), 
            React.DOM.option(null, "Human"), 
            React.DOM.option(null, "Troll"), 
            React.DOM.option(null, "Night Elf"), 
            React.DOM.option({selected: true}, "Undead")
          ), 
          React.DOM.label({htmlFor: "class"}, "Class:"), 
          React.DOM.select({id: "class", ref: "class", value: this.state.class, onChange: this.onClassChange}, 
            React.DOM.option(null, "Warrior"), 
            React.DOM.option(null, "Paladin"), 
            React.DOM.option(null, "Hunter"), 
            React.DOM.option(null, "Rogue"), 
            React.DOM.option(null, "Priest"), 
            React.DOM.option(null, "Death Knight"), 
            React.DOM.option(null, "Shaman"), 
            React.DOM.option(null, "Mage"), 
            React.DOM.option(null, "Warlock"), 
            React.DOM.option(null, "Monk"), 
            React.DOM.option({selected: true}, "Druid")
          ), 
          React.DOM.span({className: "pull-right"}, 
            React.DOM.span(null, "By "), 
            React.DOM.a({href: "https://twitter.com/cell303"}, "@cell303")
          )
        )
      ));
  },

  onNameChange: function (e) {
    this.setState({name: e.target.value});
  },

  onClassChange: function (e) {
    this.setState({class: e.target.value});
  },

  onRaceChange: function (e) {
    this.setState({race: e.target.value});
  }
});

var browser = navigator.sayswho.split(' ')[0];
if (browser === 'Chrome' || browser === 'Safari') {
  var version = navigator.sayswho.split(' ')[1];
  var major = version.split('.')[0];
  if (browser === 'Chrome' && major >= 33 ||
    browser === 'Safari' && major >= 7) {

    document.addEventListener('DOMContentLoaded', function () {
      React.renderComponent(
        App(null),
        document.body
      );
    });
  }
}


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
    /*
    window.speechSynthesis.onvoiceschanged = function() {
      this.maleVoice = window.speechSynthesis.getVoices()[1];
      this.femaleVoice = window.speechSynthesis.getVoices()[2];
    }.bind(this);
    */
    
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

    this.state.loading = false;
    this.state.error = false;
    this.state.list = concat(this.state.list, _.difference(questIds, this.state.list));

    this.play();

    this.forceUpdate();
  },

  stop: function () {
    this.state.isStopped = true;
    this.state.isPlaying = false;
    this.state.currentSentence = 0;
    speechSynthesis.cancel();
    this.forceUpdate();
  },

  prev: function () {
    this.jumpTo(this.state.current - 1);
  },

  next: function () {
    this.jumpTo(this.state.current + 1);
  },
  
  jumpTo: function (current) {
    this.stop();
    if (current >= 0 && current <= this.state.list.length) {
      this.state.current = current;
    }
    setTimeout(function () {
      this.play();
    }.bind(this), TIME_BETWEEN_QUEST_SPEAK / 2);
    this.forceUpdate();
  },

  play: function () {
    if (!this.state.isPlaying && this.state.current < this.state.list.length) {
      this.state.isPlaying = true;
      this.state.isStopped = false;
      this.forceUpdate();
      this.loop();
    }
  },

  loop: function () {
    var questId = this.state.list[this.state.current];
    var questText = this.state.questTexts[questId];
    this.speak(questText).then(function () {
      this.state.current++;
      if (this.state.current < this.state.list.length) {
        this.state.currentSentence = 0;
        setTimeout(function () {
          this.loop();
        }.bind(this), TIME_BETWEEN_QUEST_SPEAK);
      } else {
        this.state.isPlaying = false;
      }
      this.forceUpdate();
    }.bind(this));
  },
  
  prepareText: function (text) {
    return text
      .replace(/<race>/g, this.state.race)
      .replace(/<class>/g, this.state.class)
      .replace(/<name>/g, this.state.name)
      .replace(/<.*>/g, ''); // TODO: Read in a different voice
  },

  speak: function (questText) {
    var text = questText.get('title') + '.\n' + this.prepareText(questText.get('text'));
    this.state.currentSentence = 0; // needs to be set immediately

    // TODO: split further for long sentences
    var chunks = text.split(/[.!?]\s/g).map(function (chunk) {
      return chunk.trim();
    });

    var p = new Parse.Promise();

    // What follows is a load of crap that works:
    var utts = chunks.map(function (chunk) {
      var utt = new SpeechSynthesisUtterance(chunk);
      // TODO: get the correct voice?
      //utt.voice = this.maleVoice;
      utt.onend = function () {
        if (!this.state.isStopped) {
          this.state.currentSentence++;
          innerSpeak();
          this.forceUpdate();
        } else {
          p.reject("Stopped");
        }
      }.bind(this);
      return utt;
    }, this);

    var innerSpeak = function () {
      var utt = utts[this.state.currentSentence];
      if (utt) {
        console.log(utt); //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.

        setTimeout(function () {
          speechSynthesis.speak(utt);
        }, 0);
      } else {
        p.resolve('Spoken');
      }
    }.bind(this);

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
      placeholder: this.props.placeholder ? this.props.placeholder : "Paste link here...", 
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
