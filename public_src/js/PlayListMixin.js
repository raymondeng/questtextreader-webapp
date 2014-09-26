var TIME_BETWEEN_QUEST_SPEAK = 1250;

var c = require('./common');
var option = c.option;
var optionIdx = c.optionIdx;
var concat = c.concat;
var map = c.map;
var startsWith = c.startsWith;

var PlayList = {
  getInitialState: function () {
    
    /*
    window.speechSynthesis.onvoiceschanged = function() {
      this.maleVoice = window.speechSynthesis.getVoices()[1];
      this.femaleVoice = window.speechSynthesis.getVoices()[2];
    }.bind(this);
    */
    
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

    this.state.loading = false;
    this.state.error = false;
    this.state.list = concat(this.state.list, _.difference(questIds, this.state.list));

    this.play();

    this.forceUpdate(function () {
      this.focusInput();
    });
  },

  stop: function () {
    this.state.isStopped = true;
    this.state.isPlaying = false;
    this.state.currentSentence = 0;
    speechSynthesis.cancel();
    this.forceUpdate(function () {
      this.focusInput();
    });
  },

  prev: function () {
    this.jumpTo(this.state.current - 1);
  },

  next: function () {
    this.jumpTo(this.state.current + 1);
  },
  
  jumpTo: function (current) {
    this.stop();
    if (current >= 0 && current <= this.state.list.length) {
      this.state.current = current;
    }
    setTimeout(function () {
      this.play();
    }.bind(this), TIME_BETWEEN_QUEST_SPEAK / 2);
    
    this.forceUpdate(function () {
      this.focusInput();
    });
  },

  play: function () {
    if (!this.state.isPlaying && this.state.current < this.state.list.length) {
      this.state.isPlaying = true;
      this.state.isStopped = false;
      this.loop();
      this.forceUpdate(function () {
        this.focusInput();
      });
    }
  },

  loop: function () {
    var questId = this.state.list[this.state.current];
    var questText = this.state.questTexts[questId];
    this.speak(questText).then(function () {
      this.state.current++;
      if (this.state.current < this.state.list.length) {
        this.state.currentSentence = 0;
        setTimeout(function () {
          this.loop();
        }.bind(this), TIME_BETWEEN_QUEST_SPEAK);
      } else {
        this.state.isPlaying = false;
      }
      this.forceUpdate();
    }.bind(this));
  },
  
  prepareText: function (text) {
    return text
      .replace(/<race>/g, this.state.race)
      .replace(/<class>/g, this.state.class)
      .replace(/<name>/g, this.state.name)
      .replace(/<(.*)\/(.*)>/g, function (all, male, female) {
        return this.state.sex == "3" ? female : male;
      }.bind(this))
      .replace(/<(.*)>/g, function (all, cap) {
        return cap;
      });
  },

  speak: function (questText) {
    var text = questText.get('title') + '.\n' + this.prepareText(questText.get('text'));
    this.state.currentSentence = 0; // needs to be set immediately

    // TODO: split further for long sentences
    var chunks = text.split(/[.!?]\s/g).map(function (chunk) {
      return chunk.trim();
    });

    var p = new Parse.Promise();

    // What follows is a load of crap that works:
    var utts = chunks.map(function (chunk) {
      var utt = new SpeechSynthesisUtterance(chunk);
      utt.onend = function () {
        if (!this.state.isStopped) {
          this.state.currentSentence++;
          innerSpeak();
          this.forceUpdate(function () {
            this.focusInput();
          });
        } else {
          p.reject("Stopped");
        }
      }.bind(this);
      return utt;
    }, this);

    var innerSpeak = function () {
      var utt = utts[this.state.currentSentence];
      if (utt) {
        console.log(utt); //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.

        setTimeout(function () {
          speechSynthesis.speak(utt);
        }, 0);
      } else {
        p.resolve('Spoken');
      }
    }.bind(this);

    innerSpeak();

    return p;
  }
};

module.exports = PlayList;
