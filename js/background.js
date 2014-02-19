var callbacks = [];

function getSelectedText(callback) {
  chrome.tabs.getSelected(null, function(currentTab) {
    if (currentTab.url.indexOf("chrome-extension://") < 0 &&
        currentTab.url.indexOf("chrome://") < 0 &&
        currentTab.url.indexOf("https://chrome.google.com/extensions/") < 0 &&
        currentTab.url.indexOf("https://mail.google.com/mail/") < 0) {
      callbacks.push(callback);
      chrome.tabs.executeScript(null, { file: "js/content_script.js" });
    } else {
      callback(null);
    }
  });
}

chrome.extension.onRequest.addListener(function(request) {
  var callback = callbacks.shift();
  callback(request);
});
