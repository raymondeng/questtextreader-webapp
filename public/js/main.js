(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */
  
var App = require('./App.react');

Parse.initialize("B6xry2nLRUxSE4nxue6q4xzS1A2WmleBgY2UAZEY", "IeDF4F0c65lXnvgSDH1AiWguWKd6rt2DWbkD6EjE");

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


},{"./App.react":2}],2:[function(require,module,exports){
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
var CurrentText = require('./CurrentText.react');
var Remote = require('./Remote.react');
var PlayList = require('./PlayList.react');
var Footer = require('./Footer.react');
  
var App = React.createClass({displayName: 'App',
  mixins: [PlayListMixin],

  getInitialState: function () {
    return {
      term: '',
      name: "Name",
      sex: 1,
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

    var visProp = c.getHiddenProp();
    if (visProp) {
      var evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
      document.addEventListener(evtname, this.visChange);
    }
  },

  visChange: function () {
    if (!c.isHidden()) {
      this.refs["searchBox"].refs["input"].getDOMNode().focus();
    }
  },

  parse: function (str) {
    return option(str)
      .then(queryString.parse)
      .then(this.validate)
      .then(function (data) {
        this.setState({
          name: c.makeNamePronounceable(data.name),
          sex: data.sex,
          class: data.class,
          race: data.race,
          term: '',
          loading: true
        });

        return option(data['questLog'], "`questLog` parameter missing")
          .then(function (questLog) {
            try {
              questLog = JSON.parse('[' + questLog + ']');
            } catch (e) {
              return Parse.Promise.error(e);
            }
            return _.difference(questLog, this.state.list);
          }.bind(this));
      }.bind(this))
      .then(function (qs) {
        return qs.length > 0 ? Parse.Cloud.run("quests", {questIds: qs}) : [];
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
      data.hasOwnProperty('sex') &&
      data.hasOwnProperty('class') &&
      data.hasOwnProperty('race') &&
      data.hasOwnProperty('questLog')) ?
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
    } else {
      this.setState({term: ''});
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
      PlayListMixin.jumpTo.call(this, i);
    }.bind(this) : null;
  },

  onSample: function () {
    this.readQuestId(9999);
  },

  createOnChange: function (prop) {
    return function (e) {
      var state = {};
      state[prop] = e.target.value;
      this.setState(state);
    }.bind(this)
  },

  render: function () {
    return (
      React.DOM.div({className: "app"}, 
        React.DOM.div({className: "col"}, 
          React.DOM.div({className: "col-9"}, 
            React.DOM.header({id: "search-box"}, 
              SearchBox({
              ref: "searchBox", 
              value: this.state.term, 
              loading: this.state.loading, 
              error: this.state.error, 
              onChange: this.onInputChange, 
              onSubmit: this.onSubmit})
            ), 
            CurrentText({parent: this})
          ), 
          React.DOM.div({className: "col-3"}, 
            React.DOM.header({id: "remote-box"}, 
              Remote({parent: this})
            ), 
            PlayList({parent: this})
          )
        ), 
        Footer({name: this.state.name, sex: this.state.sex, race: this.state.race, class: this.state.class, createOnChange: this.createOnChange})
      ));
  }
});

module.exports = App;

},{"./CurrentText.react":3,"./Footer.react":4,"./PlayList.react":5,"./PlayListMixin":6,"./Remote.react":7,"./SearchBox.react":8,"./common":9}],3:[function(require,module,exports){
/** @jsx React.DOM */

var CurrentText = React.createClass({displayName: 'CurrentText',
  render: function () {
    var state = this.props.parent.state;

    var currentTitle, currentText;

    var currentQuestId = state.list[state.current];
    var currentQuestText = state.questTexts[currentQuestId];

    if (currentQuestText) {
      currentTitle = React.DOM.h2({className: state.currentSentence === 0 ? 'active' : ''}, currentQuestText.get('title'));
      currentText = this.props.parent.prepareText(currentQuestText.get('text'))
        .split(/[.!?]\s/g)
        .map(function (sentence, i) {
          return React.DOM.span({key: 'sentance-' + i, className: state.currentSentence === (i + 1) ? 'active' : ''}, sentence, ". ");
        }, this);
    }
    else {
      currentTitle = React.DOM.h2({className: "active"}, "WoW Quest Text Reader");
      currentText =
        React.DOM.div(null, 
          React.DOM.span({className: "active"}, "Welcome! This web app can read WoW quest texts for you. "), 
          React.DOM.span({className: "active"}, 
            React.DOM.span(null, "If you haven't done so already, please install the "), 
            React.DOM.a({href: "#"}, "Quest Text Reader addon"), 
            React.DOM.span(null, ". ")
          ), 
          React.DOM.span({className: "active"}, "This addon will generate links that tell this app what to read. "), 
          React.DOM.span({className: "active"}, 
            React.DOM.span(null, "You can also "), 
            React.DOM.a({onClick: this.props.parent.onSample}, "listen to a sample"), 
            React.DOM.span(null, ". ")
          )
        );
    }

    return (
      React.DOM.section({id: "current-text"}, 
        currentTitle, 
        currentText
      )
      );
  }
});

module.exports = CurrentText;

},{}],4:[function(require,module,exports){
/** @jsx React.DOM */
  
var Footer = React.createClass({displayName: 'Footer',
  render: function () {
    return (
      React.DOM.footer(null, 
        React.DOM.label({htmlFor: "name"}, "Name:"), 
        React.DOM.input({id: "name", ref: "name", type: "text", value: this.props.name, onChange: this.props.createOnChange('name')}), 
        React.DOM.label({htmlFor: "sex"}, "Sex:"), 
        React.DOM.select({id: "sex", ref: "sex", value: this.props.sex, onChange: this.props.createOnChange("sex")}, 
          React.DOM.option({value: "1"}, "Neutrum"), 
          React.DOM.option({value: "2"}, "Male"), 
          React.DOM.option({value: "3"}, "Female")
        ), 
        React.DOM.label({htmlFor: "race"}, "Race:"), 
        React.DOM.select({id: "race", ref: "race", value: this.props.race, onChange: this.props.createOnChange("race")}, 
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
          React.DOM.option(null, "Undead")
        ), 
        React.DOM.label({htmlFor: "class"}, "Class:"), 
        React.DOM.select({id: "class", ref: "class", value: this.props.class, onChange: this.props.createOnChange('class')}, 
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
          React.DOM.option(null, "Druid")
        ), 
        React.DOM.span({className: "pull-right"}, 
          React.DOM.span(null, "By "), 
          React.DOM.a({href: "https://twitter.com/cell303"}, "@cell303")
        )
      ));
  }
});

module.exports = Footer;

},{}],5:[function(require,module,exports){
/** @jsx React.DOM */

var c = require('./common');
var option = c.option;
var optionIdx = c.optionIdx;
var concat = c.concat;
var map = c.map;
var startsWith = c.startsWith;

var GoogleAd = React.createClass({displayName: 'GoogleAd',
  componentDidMount: function () {
    (adsbygoogle = window.adsbygoogle || []).push({});
  },

  render: function () {
    var style = {
      display: 'inline-block',
      width: this.props.width,
      height: this.props.height
    };

    return (
      React.DOM.div({className: "ad", style: style}, 
        React.DOM.div({className: "ad-fallback", style: style}, 
          this.props.children
        ), 
        React.DOM.ins({className: "adsbygoogle", 
        style: style, 
        'data-ad-client': this.props['data-ad-client'], 
        'data-ad-slot': this.props['data-ad-slot']}
        )
      )
      );
  }
});

var AdStub = React.createClass({displayName: 'AdStub',
  render: function () {
    return React.DOM.div({className: "ad"});
  }
});

var PlayList = React.createClass({displayName: 'PlayList',
  componentWillUpdate: function () {
    var node = this.refs['scroll'].getDOMNode();
    this.shouldScrollBottom = node.scrollTop + node.offsetHeight === node.scrollHeight;
  },

  componentDidUpdate: function () {
    if (this.shouldScrollBottom) {
      var node = this.refs['scroll'].getDOMNode();
      node.scrollTop = node.scrollHeight
    }
  },

  render: function () {
    var table = map(this.props.parent.state.list, function (questId, i) {
      return (
        React.DOM.tr({key: questId, className: this.props.parent.state.current === i ? 'active' : '', onClick: this.props.parent.createOnPlaylistClick(i)}, 
          React.DOM.td(null, this.props.parent.state.questTexts[questId].get("title"))
        ));
    }.bind(this));

    return (
      React.DOM.section({id: "play-list"}, 
        React.DOM.div({className: "my-ad"}, 
          GoogleAd({
          width: 336, 
          height: 280, 
          'data-ad-client': "ca-pub-0860966331181710", 
          'data-ad-slot': "9893878972"
          }, 
            React.DOM.span(null, "Deactivate your ad blocker to make this go away.")
          )
        ), 
        React.DOM.div({className: "table-wrapper", ref: "scroll"}, 
          React.DOM.table(null, 
            React.DOM.tbody(null, 
                table
            )
          )
        )
      ));
  }
});

module.exports = PlayList;

},{"./common":9}],6:[function(require,module,exports){
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

    this.forceUpdate(function () {
      this.refs["searchBox"].refs["input"].getDOMNode().focus();
    });
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
      .replace(/<(.*)\/(.*)>/g, function (all, male, female) {
        return this.state.sex == "3" ? female : male;
      }.bind(this))
      .replace(/<(.*)>/g, function (all, cap) {
        return cap;
      });
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

},{"./common":9}],7:[function(require,module,exports){
/** @jsx React.DOM */
  
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

module.exports = Remote;

},{}],8:[function(require,module,exports){
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

    var message;
    if (this.props.loading) {
      message = "Loading...";
    } else if (this.props.error) {
      message = "Error..."
    } else {
      message = "Paste link here..."
    }

    return (
      React.DOM.input({
      type: "text", 
      min: "0", 
      placeholder: message, 
      value: this.props.value, 
      ref: "input", 
      onChange: this.onChange, 
      onKeyDown: this.onKeyDown}
      ));
  }
});

module.exports = SearchBox;

},{"./common":9}],9:[function(require,module,exports){
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

module.exports = {
  option: option,
  optionIdx: optionIdx,
  concat: concat,
  map: map,
  startsWith: startsWith,
  makeNamePronounceable: makeNamePronounceable,
  getHiddenProp: getHiddenProp,
  isHidden: isHidden
};

},{}]},{},[1]);
