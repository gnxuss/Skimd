// Content script injected into every YouTube page.
//
// Innertube fetching is now done via chrome.scripting.executeScript from the
// service worker — the injected function runs in this tab's context and
// automatically inherits the user's session cookies. No message listener is
// needed here.
