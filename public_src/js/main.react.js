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

var RemoteButton = React.createClass({
  render: function () {
    return (
      <button id={"remote-" + this.props.id} className="btn btn-default" onClick={this.props.onClick}>
        <span className={"glyphicon glyphicon-" + this.props.icon} />
      </button>
      );
  }
});

var Remote = React.createClass({
  render: function () {
    var middle = this.props.parent.state.isPlaying ?
      <RemoteButton id="stop" icon="stop" onClick={this.props.parent.onStopClick} /> :
      <RemoteButton id="play" icon="play" onClick={this.props.parent.onPlayClick} />;

    return (
      <div id="remote">
        <RemoteButton id="prev" icon="backward" onClick={this.props.parent.onPrevClick} />
        {middle}
        <RemoteButton id="next" icon="forward" onClick={this.props.parent.onNextClick} />
      </div>
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

var App = React.createClass({
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
        <tr key={questId} className={this.state.current === i ? 'active' : ''} onClick={this.createOnPlaylistClick(i)}>
          <td>{this.state.questTexts[questId].get("title")}</td>
        </tr>);
    }.bind(this));

    var currentTitle, currentText;
    var currentQuestId = this.state.list[this.state.current];
    var currentQuestText = this.state.questTexts[currentQuestId];
    if (currentQuestText) {
      currentTitle = <h2 className={this.state.currentSentence === 0 ? 'active' : ''}>{currentQuestText.get('title')}</h2>;
      currentText = this.prepareText(currentQuestText.get('text'))
        .split(/[.!?]\s/g)
        .map(function (sentence, i) {
          return <span className={this.state.currentSentence === (i + 1) ? 'active' : ''}>{sentence}. </span>;
        }, this);
    } else {
      currentTitle = <h2 className='active'>WoW Quest Text Reader</h2>;
      currentText =
        <div>
          <span className="active">Welcome! This web app can read WoW quest texts to you. </span>
          <span className="active">
            <span>If you haven't done so already, please install the </span>
            <a href="#">Quest Text Reader addon</a>
            <span>. </span>
          </span>
          <span className="active">This addon will generate links that will tell this app what to read. </span>
          <span className="active">
            <span>You can also </span>
            <a onClick={this.onSample}>listen to a sample</a>
            <span>. </span>
          </span>
        </div>;

    }

    var searchBox;
    if (this.state.loading) {
      searchBox = <div className="loading">Loading...</div>;
    } else if (this.state.error) {
      searchBox = <SearchBox ref="searchBox" placeholder="Error..." value={this.state.term} onChange={this.onInputChange} onSubmit={this.onSubmit} />;
    } else {
      searchBox = <SearchBox ref="searchBox" value={this.state.term} onChange={this.onInputChange} onSubmit={this.onSubmit} />;
    }

    return (
      <div className="app">
        <div className="col-9">
          <h1>WoW Quest Text Reader</h1>
          <div id="search-box">
            {searchBox}
          </div>
          <div id="current-text">
            {currentTitle}
            {currentText}
          </div>
        </div>
        <div className="col-3">
          <div id="remote-box">
            <Remote parent={this} />
          </div>
          <div id="play-list">
            <table>
              <tbody>
              {table}
              </tbody>
            </table>
          </div>
        </div>
        <footer>
          <label htmlFor="name">Name:</label>
          <input id="name" ref="name" type="text" value={this.state.name} onChange={this.onNameChange} />
          <label htmlFor="race">Race:</label>
          <select id="race" ref="race" value={this.state.race} onChange={this.onRaceChange}>
            <option>Pandaren</option>
            <option>Worgen</option>
            <option>Goblin</option>
            <option>Draenei</option>
            <option>Blood Elf</option>
            <option>Dwarf</option>
            <option>Orc</option>
            <option>Gnome</option>
            <option>Tauren</option>
            <option>Human</option>
            <option>Troll</option>
            <option>Night Elf</option>
            <option selected={true}>Undead</option>
          </select>
          <label htmlFor="class">Class:</label>
          <select id="class" ref="class" value={this.state.class} onChange={this.onClassChange} >
            <option>Warrior</option>
            <option>Paladin</option>
            <option>Hunter</option>
            <option>Rogue</option>
            <option>Priest</option>
            <option>Death Knight</option>
            <option>Shaman</option>
            <option>Mage</option>
            <option>Warlock</option>
            <option>Monk</option>
            <option selected={true}>Druid</option>
          </select>
          <span className="pull-right">
            <span>By </span>
            <a href="https://twitter.com/cell303">@cell303</a>
          </span>
        </footer>
      </div>);
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
        <App />,
        document.body
      );
    });
  }
}

