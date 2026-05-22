chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_widget" }).catch((err) => {
      console.log("Could not send toggle message:", err);
    });
  }
});
