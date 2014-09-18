/** @jsx React.DOM */

var BASE_URL = 'http://questtextreader.parseapp.com';

var TIME_BETWEEN_QUEST_SPEAK = 1250;

Parse.initialize("B6xry2nLRUxSE4nxue6q4xzS1A2WmleBgY2UAZEY", "IeDF4F0c65lXnvgSDH1AiWguWKd6rt2DWbkD6EjE");

/**
 * @param some {*}
 * @param errorText {string=}
 * @returns {Parse.Promise}
 */
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

if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str) {
    return this.slice(0, str.length) == str;
  };
}

var PlayList = {
  getInitialState: function () {
    return {
      current: 0,
      list: [],
      isPlaying: false,
      isStopped: false
    }
  },

  add: function (questText) {
    this.addAll([questText]);
  },

  addAll: function (questTexts) {
    this.state.list = concat(this.state.list, questTexts);

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
    var questText = this.state.list[this.state.current];
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
      text: text
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

var SearchBox = React.createClass({
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
      <input
      type="text"
      min="0"
      placeholder="Quest Id"
      value={this.props.value}
      ref="input"
      onChange={this.onChange}
      onKeyDown={this.onKeyDown}
      />);
  }
});

var App = React.createClass({
  mixins: [PlayList],

  getInitialState: function () {
    return {
      term: '',
      text: '',
      name: "Cell",
      race: "Gnome",
      class: "Rogue"
    }
  },

  componentDidMount: function () {
    this.parse(location.search);


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
          term: ''
        });
        return JSON.parse(data.qs)
      }.bind(this))
      .then(function (qs) {
        return Parse.Cloud.run("quests", {
          questIds: qs
        });
      })
      // TODO: parse collection?
      .then(this.addAll);
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

    if (term.startsWith(BASE_URL)) {
      this.parse(term.split('?')[1]);
    }
  },

  onPlayClick: function () {
    var term = this.state.term;
    var questId;
    if (term.startsWith(BASE_URL)) {
      this.parse(term.split('?')[1])
    } else {
      questId = Number(term);
      if (isNaN(questId)) {
        console.error("questId isNaN");
        // TODO: error to user
        return;
      }

      this.setState({
        term: ''
      });

      Parse.Cloud.run('quest', {
        questId: questId
      })
        .then(this.add);
    }
  },

  onStopClick: function () {
    this.stop();
  },

  render: function () {
    var table = map(this.state.list, function (questText) {
      return (
        <tr>
          <td>{questText.get("title")}</td>
        </tr>);
    });

    return (
      <div className="content">
        <div className="row">
          <div className="col-md-9">
            <h1>WoW Quest Text Reader</h1>
            <SearchBox ref="searchBox" value={this.state.term} onChange={this.onInputChange} onSubmit={this.onPlayClick} />
            <button onClick={this.onPlayClick}>Play</button>
            <button onClick={this.onStopClick}>Stop</button>
            <div>
              {this.state.text}
            </div>
          </div>
          <div className="col-md-3">
            <dl>
              <dt>Name</dt>
              <dd>{this.state.name}</dd>
              <dt>Class</dt>
              <dd>{this.state.class}</dd>
              <dt>Race</dt>
              <dd>{this.state.race}</dd>
            </dl>
            <table className="table">
              <tbody>
                {table}
              </tbody>
            </table>
          </div>
        </div>
      </div>);
  }
});

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

React.renderComponent(
  <App />,
  document.body
);

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

