/** @jsx React.DOM */
  
var c = require('./common');
var option = c.option;
var optionIdx = c.optionIdx;
var concat = c.concat;
var map = c.map;
var startsWith = c.startsWith;

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

    var message;
    if (this.props.loading) {
      message = "Loading...";
    } else if (this.props.error) {
      message = "Error..."
    } else {
      message = "Paste link here..."
    }

    return (
      <input
      type="text"
      min="0"
      placeholder={message}
      value={this.props.value}
      ref="input"
      onChange={this.onChange}
      onKeyDown={this.onKeyDown}
      />);
  }
});

module.exports = SearchBox;
