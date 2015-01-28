'use strict';

var { Class } = require('sdk/core/heritage');
var { Cc, Ci, Cu, Cm } = require('chrome');
var xpcom = require('sdk/platform/xpcom');
var categoryManager = Cc["@mozilla.org/categorymanager;1"]
                      .getService(Ci.nsICategoryManager);

var DNSSD = require("./dns-sd.js");
var SVCTYPES = require("./service-types.js");

var contractId = '@mozilla.org/service-discovery;1';

var currentTarget;

var ServiceDiscovery = Class({
  extends: xpcom.Unknown,
  interfaces: [ Ci.nsIDOMGlobalPropertyInitializer ],
  get wrappedJSObject() this,

  init: function(win) {
    var eventHandler = new EventHandler();

    return {
      startDiscovery: function(target) {
        currentTarget = target;
        DNSSD.startDiscovery(target);
      },

      stopDiscovery: function() {
        DNSSD.stopDiscovery();
      },

      registerService: function(serviceName, port, options) {
        DNSSD.registerService(serviceName, port, options);
      },

      registerListener: function(topic, listener) {
        eventHandler.addEventListener(topic, listener);
      },

      removeListener: function(topic, listener) {
        eventHandler.removeEventListener(topic, listener);
      },

      __exposedProps__: {
        startDiscovery: 'r',
        stopDiscovery: 'r',
        registerService: 'r',
        registerListener: 'r',
        removeListener: 'r'
      }
    };
  }
});

// Create and register the factory
var factory = xpcom.Factory({
  contract: contractId,
  Component: ServiceDiscovery,
  unregister: false
});

// XPCOM clients can retrieve and use this new
// component in the normal way
var wrapper = Cc[contractId].createInstance(Ci.nsISupports);

var EventHandler = function() {
  var self = this,
  eventList = {};

  DNSSD.on('discovered', function(evt) {
    for (var i = 0; i < evt.services.length; i++) {
      if (!currentTarget || currentTarget == evt.services[i]) {
        let service = evt.services[i].replace('.local', '');
        let message = SVCTYPES.getServiceName(service) + ":" + evt.domainNames[i] + ":" + evt.address;
        console.log("discovered: " + message);
        self.fireEvent('discovered', message);
      }
    }
  });

  this.addEventListener = function(eventName, callback) {
    if(!eventList[eventName]) {
      eventList[eventName] = [];
    }
    eventList[eventName].push(callback);
  };

  this.removeEventListener = function(eventName, callback) {
    var idx = -1;
    if (eventList[eventName]) {
      idx = eventList[eventName].indexOf(callback);
      if(idx != -1) {
        eventList[eventName].splice(idx, 1);
      }
    }
  };

  this.fireEvent = function(eventName, eventObject) {
    if (eventList[eventName]) {
      for (var i = 0; i < eventList[eventName].length; i++) {
        eventList[eventName][i](eventObject);
      }
    }
  };
};

categoryManager.deleteCategoryEntry("JavaScript-navigator-property", contractId, false);
categoryManager.addCategoryEntry("JavaScript-navigator-property", "sd", contractId, false, true);

