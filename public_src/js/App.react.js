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
  
var App = React.createClass({
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
      this.focusInput();
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
        return qs.length > 0 ? Parse.Cloud.run("quests", {questIds: qs}) : Parse.Promise.error("No new quests...");
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
  
  focusInput: function () {
    this.refs["searchBox"].refs["input"].getDOMNode().focus();
  },

  onPlayClick: function () {
    PlayListMixin.play.call(this);
    this.focusInput();
  },

  onStopClick: function () {
    PlayListMixin.stop.call(this);
    this.focusInput();
  },

  onPrevClick: function () {
    PlayListMixin.prev.call(this);
    this.focusInput();
  },

  onNextClick: function () {
    PlayListMixin.next.call(this);
    this.focusInput();
  },

  createOnPlaylistClick: function (i) {
    return this.state.current !== i ? function () {
      PlayListMixin.jumpTo.call(this, i);
      this.focusInput();
    }.bind(this) : null;
  },

  onSample: function () {
    this.readQuestId(9999);
    this.focusInput();
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
      <div className="app">
        <div className="col">
          <div className="col-9">
            <header id="search-box">
              <SearchBox 
              ref="searchBox" 
              value={this.state.term} 
              loading={this.state.loading}
              error={this.state.error}
              onChange={this.onInputChange} 
              onSubmit={this.onSubmit} />
            </header>
            <CurrentText parent={this} />
          </div>
          <div className="col-3">
            <header id="remote-box">
              <Remote parent={this} />
            </header>
            <PlayList parent={this} />
          </div>
        </div>
        <Footer name={this.state.name} sex={this.state.sex} race={this.state.race} class={this.state.class} createOnChange={this.createOnChange} />
      </div>);
  }
});

module.exports = App;
