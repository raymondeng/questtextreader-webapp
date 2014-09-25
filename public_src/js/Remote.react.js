/** @jsx React.DOM */
  
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

module.exports = Remote;
