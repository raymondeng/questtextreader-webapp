/** @jsx React.DOM */
  
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

module.exports = GoogleAd;
