/*
 * Util
 */
String.prototype.trim = function() {
  return this.replace(/^[\s　]+$/g, "");
};

String.prototype.toHankaku = function() {
  return this.replace(/[０-９]/g, function(str){
    return String.fromCharCode(str.charCodeAt(0)-65248);
  });
};

/*
 * Callback
 */
function msTranslateCallback(result) {
  $("#result").val(result);
  saveLocalStorage(result);
}

function msSpeakCallback(result) {
  $("body").append($("<iframe>").attr("src", result).hide());
}

/*
 * Storage
 */
function saveLocalStorage(result) {
  localStorage.translationText = $("#text").val();
  localStorage.translationResult = result;
}

function loadLocalStorage(){
  if(localStorage.translationText) {
    $("#text").val(localStorage.translationText);
  }
  if(localStorage.translationResult) {
    $("#result").val(localStorage.translationResult);
  }
}

/*
 * Constants
 */
var DEBUG = false;

var ERROR_EMPTY = "入力が空です。";
var ERROR_NOT_FOUND = "は見つかりませんでした。";
var ERROR_SERVER = "サーバーから応答がありません。"

var BING_APP_ID = "6DB16C8155FF50AB1445D8A057BFC6F90840F26A";
var MICROSOFT_TRANSLATOR_URL = "http://api.microsofttranslator.com/V2/Ajax.svc/";

/*
 * Main
 */
$(function(){

  $("#translateEnglish").focus();

  var bg = chrome.extension.getBackgroundPage();
  bg.getSelectedText(function(selectedText) {
    if (selectedText != null && selectedText !== "") {
      $("#text").val(selectedText);
    }
  });

  loadLocalStorage();

  var translate = function(fromLang, toLang) {

    $("#error").empty();
    $("#loader").show();

    if ($("#text").val() !== "") {

      var params = {
        "oncomplete": "msTranslateCallback",
        "appId": BING_APP_ID,
        "from": fromLang,
        "to": toLang,
        "text": $("#text").val()
      };

      $.ajax({
        type: "GET",
        url: MICROSOFT_TRANSLATOR_URL + "Translate",
        data: params,
        success: function(result) {
          $("#loader").hide();
          DEBUG && alert("result: " + result);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          $("#loader").hide();
          DEBUG && alert("SearchDicItemLite: " + textStatus + " - " + errorThrown);
          $("#error").text("ERROR_SERVER");
        }
      });

    } else {
      $("#loader").hide();
      $("#error").text(ERROR_EMPTY);
    }
  };

  var speak = function() {

    $("#error").empty();
    $("#loader").show();

    if ($("#text").val() !== "") {

      var params = {
        "oncomplete": "msSpeakCallback",
        "appId": BING_APP_ID,
        "text": $("#result").val(),
        "language": "en"
      };

      $.ajax({
        type: "GET",
        url: MICROSOFT_TRANSLATOR_URL + "Speak",
        data: params,
        success: function(result) {
          $("#loader").hide();
          DEBUG && alert("result: " + result);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          $("#loader").hide();
          DEBUG && alert("SearchDicItemLite: " + textStatus + " - " + errorThrown);
          $("#error").text("ERROR_SERVER");
        }
      });

    } else {
      $("#error").text(ERROR_EMPTY);
    }
  };

  $("#translateEnglish").click(function(evt){
    translate("ja", "en");
  });
  $("#translateJapanese").click(function(evt){
    translate("en", "ja");
  });
  $("#speakEnglish").click(function(evt){
    speak();
  });

  var dejizo = function(dic) {

    var DEJIZO_SEARCH_URL = "http://public.dejizo.jp/NetDicV09.asmx/SearchDicItemLite";
    var DEJIZO_GET_URL = "http://public.dejizo.jp/NetDicV09.asmx/GetDicItemLite";

    $("#error").empty();
    if ($("#text").val() !== "") {
      var word = $("#text").val();
      var params = {
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
        type: "GET",
        url: DEJIZO_SEARCH_URL,
        data: params,
        success: function(xml) {
          if ($(xml).find("ItemID").length !== 0) {
            $("#result").val("");
            $(xml).find("ItemID").each(function(){
              var itemId = $(this).text();
              var params = {
                "Dic": dic,
                "item": itemId,
                "Loc": "",
                "Prof": "XHTML"
              };
              $.ajax({
                type: "GET",
                url: DEJIZO_GET_URL,
                data: params,
                success: function(xml) {
                  var head = $(xml).find(".NetDicHeadTitle")
                                   .text()
                                   .trim()
                                   .replace(/\s{2,}/g, " ")
                                   .replace(/\t{2,}/g, "\n");
                  var body = $(xml).find(".NetDicBody")
                                   .text()
                                   .trim()
                                   .replace(/\s{2,}/g, " ")
                                   .replace(/\t{2,}/g, "\n");
                  $("#result").val($("#result").val() + head + "\n" + body + "\n");
                  saveLocalStorage($("#result").val());
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                  DEBUG && alert("GetDicItemLite: " + textStatus + " - " + errorThrown);
                   $("#error").text("ERROR_SERVER");
                }
              });
            });
          } else {
            $("#error").text(
              "[" + (word.length > 10 ? word.slice(0, 10) + "..." : word ) + "]"
                  + ERROR_NOT_FOUND
            );
          }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          DEBUG && alert("SearchDicItemLite: " + textStatus + " - " + errorThrown);
          $("#error").text("ERROR_SERVER");
        }
      });
    } else {
      $("#error").text(ERROR_EMPTY);
    }
  };
  $("#EJDictionary").click(function(){
    dejizo("EJdict");
  });
  $("#JEDictionary").click(function(){
    dejizo("EdictJE");
  });

  $(window).keyup(function(e){
    if(e.keyCode === 120) {
      $("#translateEnglish").click();
    } else if(e.keyCode === 121) {
      $("#translateJapanese").click();
    } else if(e.keyCode === 122) {
      $("#EJDictionary").click();
    } else if(e.keyCode === 123) {
      $("#JEDictionary").click();
    }
  });
});