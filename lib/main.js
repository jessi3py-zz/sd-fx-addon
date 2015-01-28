var {Cc, Ci, Cu} = require("chrome");

var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var self = require("sdk/self");

var DNSSD = require("./dns-sd.js");
var DISCOVERY = require("./discovery");

var button = ToggleButton({
  id: "dns-sd-btn",
  label: "dns-sd enabled!",
  icon: {"16": "./icon-16.png"},
  onChange: handleChange
});

var panel = panels.Panel({
  contentURL: self.data.url("panel.html"),
  width: 500,
  height: 350,
  onHide: handleHide
});

function handleChange(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
  }
}

function handleHide() {
  button.state('window', {checked: false});
}

// When the panel is displayed it generated an event called
// "show": we will listen for that event and when it happens,
// send our own "show" event to the panel's script, so the
// script can prepare the panel for display.
// panel.on("show", function() {
//   panel.port.emit("show");
// });