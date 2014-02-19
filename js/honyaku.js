/*
 * Util
 */
String.prototype.trim = function() {
  return this.replace(/^[\s　]+$/g, "");
};

String.prototype.toHankaku = function() {
  return this.replace(/[０-９]/g, function(str) {
    return String.fromCharCode(str.charCodeAt(0) - 65248);
  });
};

String.prototype.unescapeUnicode = function(str) {
  return str.replace(/\\u([a-fA-F0-9]{4})/g, function(matchedString, group1) {
    return String.fromCharCode(parseInt(group1, 16));
  });
};

/*
 * Storage
 */
function saveLocalStorage(result) {
  localStorage.setItem('translationText',   $("#text").val());
  localStorage.setItem('translationResult', result);
}

function loadLocalStorage() {
  if (localStorage.getItem('translationText')) {
    $("#text").val(localStorage.getItem('translationText'));
  }
  if (localStorage.getItem('translationResult')) {
    $("#result").text(localStorage.getItem('translationResult'));
  }
}

function showError(message) {
  $("#error").empty().text(message).show().fadeOut(2000);
}

/*
 * Constants
 */
var DEBUG = false,
    ERROR_EMPTY     = "テキストを入力してください。",
    ERROR_NOT_FOUND = "は見つかりませんでした。",
    ERROR_SERVER    = "サーバーから応答がありません。",
    BING_APP_ID              = "6DB16C8155FF50AB1445D8A057BFC6F90840F26A",
    MICROSOFT_TRANSLATOR_URL = "http://api.microsofttranslator.com/V2/Ajax.svc/";

if (localStorage.getItem('bingAppId') && localStorage.getItem('bingAppId') !== '') {
  BING_APP_ID = localStorage.getItem('bingAppId');
}

/*
 * Main
 */
$(function() {

  $("#translateEnglish").focus();

  var translate, speak, dejizo,
  bg = chrome.extension.getBackgroundPage();
  bg.getSelectedText(function(selectedText) {
    if (selectedText !== null && selectedText !== "") {
      $("#text").val(selectedText);
    }
  });

  loadLocalStorage();

  translate = function(fromLang, toLang) {

    $("#loader").show();

    if ($("#text").val() !== "") {

      var text = $("#text").val();

      var params = {
        "appId": BING_APP_ID,
        "from":  fromLang,
        "to":    toLang,
        "text":  text
      };

      $.ajax({
        url: MICROSOFT_TRANSLATOR_URL + "Translate",
        data: params,
        dataType: 'json',
        timeout: 15000,
        success: function(result) {
          result = result.unescapeUnicode(result)
                         .replace(/^"/, '')
                         .replace(/"$/, '')
                         .replace(/\\\//g, '/')
                         .replace(/\\"/g, '"');
          $("#loader").hide();
          $("#result").text(result);
          saveLocalStorage(result);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          $("#loader").hide();
          showError(ERROR_SERVER);
        }
      });

    } else {
      $("#loader").hide();
      showError(ERROR_EMPTY);
    }
  };

  speak = function() {

    $("#loader").show();

    if ($("#text").val() !== "") {

      var params = {
        "appId": BING_APP_ID,
        "text": $("#result").text(),
        "language": "en"
      };

      $.ajax({
        dataType: "json",
        url: MICROSOFT_TRANSLATOR_URL + "Speak",
        data: params,
        timeout: 20000,
        success: function(result) {
          result = result.replace(/^"/, '').replace(/"$/, '');
          $("#loader").hide();
          $("iframe").remove();
          $("body").append($("<iframe>").attr("src", result).hide());
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          $("#loader").hide();
          showError(ERROR_SERVER);
        }
      });

    } else {
      $("#loader").hide();
      showError(ERROR_EMPTY);
    }
  };

  $("#translateEnglish").on('click', function(evt) {
    translate("ja", "en");
  });
  $("#translateJapanese").on('click', function(evt) {
    translate("en", "ja");
  });
  $("#speakEnglish").on('click', function(evt) {
    speak();
  });

  dejizo = function(dic) {

    var DEJIZO_SEARCH_URL = "http://public.dejizo.jp/NetDicV09.asmx/SearchDicItemLite",
        DEJIZO_GET_URL    = "http://public.dejizo.jp/NetDicV09.asmx/GetDicItemLite",
        word, params;

    if ($("#text").val() !== "") {
      word = $("#text").val();
      params = {
        "Dic": dic,
        "Word": word,
        "Scope": "HEADWORD",
        "Match": "STARTWITH",
        "Merge": "OR",
        "Prof": "XHTML",
        "PageSize": "4",
        "PageIndex": "0"
      };

      $.ajax({
        url: DEJIZO_SEARCH_URL,
        data: params,
        timeout: 20000,
        success: function(xml) {
          if ($(xml).find("ItemID").length !== 0) {
            $("#result").text("");
            $(xml).find("ItemID").each(function() {
              var itemId = $(this).text(), params;
              params = {
                "Dic": dic,
                "item": itemId,
                "Loc": "",
                "Prof": "XHTML"
              };
              $.ajax({
                url: DEJIZO_GET_URL,
                data: params,
                timeout: 20000,
                success: function(xml) {
                  var head, body;
                  head = $(xml).find(".NetDicHeadTitle")
                               .text()
                               .trim()
                               .replace(/\s{2,}/g, " ")
                               .replace(/\t{2,}/g, "\n");

                  body = $(xml).find(".NetDicBody")
                               .text()
                               .trim()
                               .replace(/\s{2,}/g, " ")
                               .replace(/\t{2,}/g, "\n");
                  $("#result").text($("#result").text() + head + "\n" + body + "\n");
                  saveLocalStorage($("#result").text());
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                  showError(ERROR_SERVER);
                }
              });
            });
          } else {
            showError(
              '"' + (word.length > 10 ? word.slice(0, 10) + "..." : word) + '" ' +
              ERROR_NOT_FOUND
            );
          }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          showError(ERROR_SERVER);
        }
      });
    } else {
      showError(ERROR_EMPTY);
    }
  };
  $("#EJDictionary").on('click', function() {
    dejizo("EJdict");
  });
  $("#JEDictionary").on('click', function() {
    dejizo("EdictJE");
  });

  $(window).keyup(function(e) {
    if (e.keyCode === 120) {
      $("#translateEnglish").click();
    } else if (e.keyCode === 121) {
      $("#translateJapanese").click();
    } else if (e.keyCode === 122) {
      $("#EJDictionary").click();
    } else if (e.keyCode === 123) {
      $("#JEDictionary").click();
    }
  });

});
