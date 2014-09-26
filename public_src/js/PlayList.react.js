/** @jsx React.DOM */

var c = require('./common');
var option = c.option;
var optionIdx = c.optionIdx;
var concat = c.concat;
var map = c.map;
var startsWith = c.startsWith;

var GoogleAd = React.createClass({
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
      <div className="ad" style={style}>
        <div className="ad-fallback" style={style}>
          {this.props.children}
        </div>
        <ins className="adsbygoogle"
        style={style}
        data-ad-client={this.props['data-ad-client']}
        data-ad-slot={this.props['data-ad-slot']}
        />
      </div>
      );
  }
});

var AdStub = React.createClass({
  render: function () {
    return <div className="ad" />;
  }
});

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
        <tr key={questId} className={this.props.parent.state.current === i ? 'active' : ''} onClick={this.props.parent.createOnPlaylistClick(i)}>
          <td>{this.props.parent.state.questTexts[questId].get("title")}</td>
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

module.exports = PlayList;
