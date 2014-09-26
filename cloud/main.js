var he = require('cloud/vendor/he');

var QuestText = Parse.Object.extend("QuestText");
var OriginalResponse = Parse.Object.extend("OriginalResponse");

/**
 * @param some {*}
 * @param errorText {string=}
 * @returns {Parse.Promise}
 */
function option(some, errorText) {
  return some ?
    Parse.Promise.as(some) :
    Parse.Promise.error(Error(errorText || 'None'));
}

function optionIdx(idx, errorText) {
  return (idx >= 0) ?
    Parse.Promise.as(idx) :
    Parse.Promise.error(Error(errorText || 'None'));
}

/**
 * @param questId {string}
 * @returns {Parse.Promise<Parse.Cloud.HTTPResponse>}
 */
function scrap(questId) {
  return new Parse.Query(OriginalResponse)
    .equalTo("questId", questId)
    .equalTo("version", 2)
    .first()
    .then(option)
    .then(function (originalResponse) {
      return originalResponse;
    }, function () {
      return Parse.Cloud.httpRequest({
        method: "GET",
        url: "http://www.thottbot.com/quest=" + questId
      });
    });
}

function extractText(response) {
  var text = response.text;

  var h3Description = 'Description</h2>';
  var h3DescriptionEnd = '<h2';

  return optionIdx(text.indexOf(h3Description), "Description not found")
    .then(function (idx) {
      var start = idx + h3Description.length;
      var end = text.indexOf(h3DescriptionEnd, start + 1);
      return optionIdx(end, "End of description not found")
        .then(function (end) {
          return text.substr(start, end - start)
            .trim()
            .replace(/<br \/>/g, '\n')
        });
    })
    .then(he.decode);
}

function extractTitle(response) {
  var text = response.text;

  var titleStart = '<h1 class="heading-size-1">';
  var titleEnd = '</h1>';

  return optionIdx(text.indexOf(titleStart), "Title start not found")
    .then(function (idx) {
      var start = idx + titleStart.length;
      var end = text.indexOf(titleEnd, start + 1);
      return optionIdx(end, "Title end not found")
        .then(function (end) {
          return text.substr(start, end - start).trim()
        });
    })
    .then(he.decode);
}

/**
 * @param {number} questId
 * @param {Parse.Promise<Parse.Cloud.HTTPResponse>} response
 * @returns {Parse.Promise<QuestText>}
 */
function extract(questId, response) {
  var originalResponse = new OriginalResponse();
  originalResponse.save({
    questId: questId,
    text: response['text'],
    version: 2
  });

  return Parse.Promise.when(extractTitle(response), extractText(response))
    .then(function (title, text) {
      return new Parse.Query(QuestText)
        .equalTo("questId", questId)
        .first()
        .then(option)
        .then(function (questText) {
          console.warn("Quest with id " + questId + " already exists. Not saving");
          return questText;
        }, function () {
          var qt = new QuestText();
          return qt.save({
            questId: questId,
            title: title,
            text: text
          });
        });
    });
}

function getQuestText(questId) {
  return new Parse.Query(QuestText)
    .equalTo('questId', questId)
    .first()
    .then(option)
    .then(function foundQuestText(questText) {
      return questText;
    }, function questTextMissing() {
      return scrap(questId).then(extract.bind(null, questId))
    });
}

Parse.Cloud.define("quests", function (request, response) {
  Parse.Cloud.useMasterKey();
  
  option(request.params['questIds'], "questIds missing")
    .then(function (questIds) {
      return Parse.Promise.when(questIds.map(Number).map(getQuestText));
    })
    .then(function success() {
      response.success(Array.prototype.slice.call(arguments, 0));
    }, onError.bind(null, response));
});

Parse.Cloud.define("quest", function (request, response) {
  Parse.Cloud.useMasterKey();
  
  option(request.params['questId'], "questId missing")
    .then(Number)
    .then(getQuestText)
    .then(function success(questText) {
      response.success(questText);
    }, onError.bind(null, response));
});

var Counter = Parse.Object.extend("Counter");

Parse.Cloud.job("scrap", function (request, status) {
  Parse.Cloud.useMasterKey();
  
  withConfig(function (config) {
    option(request.params['questId'])
      .then(function (questId) {
        return questId
      }, function () {
        return new Parse.Query(Counter)
          .first()
          .then(option)
          .then(function (counter) {
            return counter
          }, function counterMissing() {
            var counter = new Counter();
            return counter.save('questId', 0);
          })
          .then(function (counter) {
            counter.increment('questId');
            return counter.save();
          })
          .then(function (counter) {
            return counter.get('questId');
          })
      })
      .then(function (questId) {
        if (questId <= config.get("maxQuestId")) {
          return scrap(questId).then(extract.bind(null, questId));
        } else {
          return Parse.Promise.error(Error("Maximum quest id reached"));
        }
      })
      .then(function (questText) {
        var questId = questText.get('questId');
        status.success("Fetched quest " + questId);
      }, onError.bind(null, status));
  });
});

function withConfig(f) {
  return Parse.Config.get().then(f);
}

function onError(status, error) {
  console.error(error);
  status.error(error ? error.message : 'error is undefined');
}
