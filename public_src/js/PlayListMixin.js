var TIME_BETWEEN_QUEST_SPEAK = 1250;

var c = require('./common');
var option = c.option;
var optionIdx = c.optionIdx;
var concat = c.concat;
var map = c.map;
var startsWith = c.startsWith;

var PlayList = {
  getInitialState: function () {
    return {
      current: 0,
      list: [],
      questTexts: {},
      isPlaying: false,
      isStopped: false
    }
  },

  add: function (questText) {
    this.addAll([questText]);
  },

  addAll: function (questTexts) {
    var questIds = map(questTexts, function (questText) {
      var questId = questText.get("questId");
      this.state.questTexts[questId] = questText;
      return questId;
    }.bind(this));

    // TODO: deal with duplicates
    this.state.loading = false;
    this.state.error = false;
    this.state.list = concat(this.state.list, _.without(questIds, this.state.list));

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
    var questId = this.state.list[this.state.current];
    var questText = this.state.questTexts[questId];
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
      currentText: text
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

module.exports = PlayList;
