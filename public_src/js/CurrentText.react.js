/** @jsx React.DOM */

var CurrentText = React.createClass({
  render: function () {
    var state = this.props.parent.state;

    var currentTitle, currentText;

    var currentQuestId = state.list[state.current];
    var currentQuestText = state.questTexts[currentQuestId];

    if (currentQuestText) {
      currentTitle = <h2 className={state.currentSentence === 0 ? 'active' : ''}>{currentQuestText.get('title')}</h2>;
      currentText = this.props.parent.prepareText(currentQuestText.get('text'))
        .split(/[.!?]\s/g)
        .map(function (sentence, i) {
          return <span key={'sentance-' + i} className={state.currentSentence === (i + 1) ? 'active' : ''}>{sentence}. </span>;
        }, this);
    }
    else {
      currentTitle = <h2 className='active'>WoW Quest Text Reader</h2>;
      currentText =
        <div>
          <span className="active">Welcome! This web app can read quest texts to you. </span>
          <span className="active">
            <span>If you haven't done so already, please install the </span>
            <a href={"http://www.curse.com/addons/wow/quest-text-reader"}>Quest Text Reader addon</a>
            <span>. </span>
          </span>
          <span className="active">This addon will generate individual links that tell this app which quest texts to read. </span>
          <span className="active">
            <span>You can also </span>
            <a onClick={this.props.parent.onSample}>listen to a sample</a>
            <span>. </span>
          </span>
        </div>;
    }

    return (
      <section id="current-text">
        {currentTitle}
        {currentText}
      </section>
      );
  }
});

module.exports = CurrentText;
