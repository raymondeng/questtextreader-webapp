/** @jsx React.DOM */

var c = require('./common');
var option = c.option;
var optionIdx = c.optionIdx;
var concat = c.concat;
var map = c.map;
var startsWith = c.startsWith;

var GoogleAd = require("./GoogleAd.react");

var PlayList = React.createClass({
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
        <tr key={questId} className={this.props.parent.state.current === i ? 'active' : ''}>
          <td onClick={this.props.parent.createOnPlaylistClick(i)}>{this.props.parent.state.questTexts[questId].get("title")}</td>
          <td className="wowhead"><a href={"//www.wowhead.com/quest=" + questId} target="_blank"></a></td>
        </tr>);
    }.bind(this));

    return (
      <section id="play-list">
        <div className="my-ad">
          <GoogleAd
          width={336}
          height={280}
          data-ad-client="ca-pub-0860966331181710"
          data-ad-slot="9893878972"
          >
          </GoogleAd>
        </div>
        <div className="table-wrapper" ref="scroll">
          <table>
            <tbody>
                {table}
            </tbody>
          </table>
        </div>
      </section>);
  }
});

/*
 var AdStub = React.createClass({
 render: function () {
 return <div className="ad" />;
 }
 });
 */

module.exports = PlayList;
