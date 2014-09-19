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

var App = React.createClass({
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
        <tr key={questId}>
          <td>{this.state.questTexts[questId].get("title")}</td>
        </tr>);
    }.bind(this));

    var searchBox = this.state.loading ?
      'Loading...' :
      <SearchBox ref="searchBox" value={this.state.term} onChange={this.onInputChange} onSubmit={this.onPlayClick} />;

    return (
      <div className="content">
        <div className="row">
          <div className="col-md-9">
            <h1>WoW Quest Text Reader</h1>
            {searchBox}
            <button onClick={this.onPlayClick}>Play</button>
            <button onClick={this.onStopClick}>Stop</button>
            <button onClick={this.onPrevClick}>Prev</button>
            <button onClick={this.onNextClick}>Next</button>
            { this.state.error ? "Error..." : null}
            <div>
              {this.state.currentText}
            </div>
          </div>
          <div className="col-md-3">
            <dl className="dl-horizontal">
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

document.addEventListener('DOMContentLoaded', function () {
  React.renderComponent(
    <App />,
    document.body
  );
});
