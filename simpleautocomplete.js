(function () {

  'use strict';

  // SimpleAutocomplete.
  var SimpleAutocomplete = window.SimpleAutocomplete = {};

  // Key codes.
  SimpleAutocomplete.KeyCodes = {
    TAB: 9,
    ENTER: 13,
    ESC: 27,
    END: 35,
    HOME: 36,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
  };

  // Bind a function to a context.
  SimpleAutocomplete.bind = function (fn, context) {
    var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
    return function () {
      return fn.apply(context, args || arguments);
    };
  };

  // Implementation of setTimeout that deals with this and arguments.
  SimpleAutocomplete.setTimeout = function (callback, delay) {
    var context = this;
    var args = Array.prototype.slice.call(arguments, 2);
    return setTimeout(function () {
      callback.apply(context, args);
    }, delay);
  };

  // Send request to a url.
  SimpleAutocomplete.send = function (url, callback, options) {
    options = options || {};

    var xhr = new XMLHttpRequest();
    var xdr = false;
    var useOnreadyState = false;
    var success = 200;
    var method = typeof options.method !== 'undefined' ? options.method : 'GET';
    var headers = typeof options.headers !== 'undefined' ? options.headers : null;
    var data = typeof options.data !== 'undefined' ? options.data : null;

    // Clean options so we can merge them with the xhr object to allow
    // adding or overriding properties.
    delete options.method;
    delete options.headers;
    delete options.data;

    // Check if we can use XMLHttpRequest or try with XDomainRequest (IE).
    if (!('withCredentials' in xhr)) {
      var location = window.location.protocol + '//' + window.location.hostname;
      var pattern = '^' + SimpleAutocomplete.escapeRegExp(location) + '(/|$)';
      var sameDomain = new RegExp(pattern);
      var absoluteURL = new RegExp('^(?:[a-z]+:)?//', 'i');

      if (absoluteURL.test(url) && !sameDomain.test(url)) {
        if (window.XDomainRequest) {
          xhr = new window.XDomainRequest();
          xdr = true;
          success = null;
        }
        else {
          callback(false, 'Browser not supported.');
          return null;
        }
      }
      else {
        useOnreadyState = true;
      }
    }

    // Make sure the callback is executed only once by setting it to noop.
    var handler = function () {
      callback.apply(xhr, arguments);
      callback = function () {
        // Noop.
      };
    };

    if (useOnreadyState) {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          var status = typeof xhr.status !== 'undefined' ? xhr.status : null;
          if (status === success) {
            handler(true, xhr.responseText);
          }
          else {
            handler(false, xhr.statusText);
          }
        }
      };
    }
    else {
      xhr.onprogress = function () {
        // Ignored.
      };

      xhr.onload = function () {
        if (this.status === success) {
          handler(true, this.responseText);
        }
        else {
          handler(false, this.statusText);
        }
      };

      xhr.onerror = function () {
        handler(false, this.statusText);
      };
    }

    xhr.open(method, url, true);

    // Set headers if any (only works with XMLHttpRequest).
    if (headers && 'withCredentials' in xhr) {
      for (var header in headers) {
        if (headers.hasOwnProperty(header)) {
          xhr.setRequestHeader(header, headers[header]);
        }
      }
    }

    // Extra parameters and overrides.
    SimpleAutocomplete.extend(xhr, options);

    // Wrap the call to prevent losing some requests when mulitple
    // XDomainRequests are being used at the same time.
    if (xdr) {
      SimpleAutocomplete.setTimeout(function () {
        xhr.send(data);
      }, 0);
    }
    else {
      xhr.send(data);
    }

    return xhr;
  };
  // Send a GET request to a URL.
  SimpleAutocomplete.get = function (url, callback, options) {
    options = options || {};
    options.method = 'GET';
    return SimpleAutocomplete.send(url, callback, options);
  };
  // Send a POST request to a URL.
  SimpleAutocomplete.post = function (url, callback, options) {
    options = options || {};
    options.method = 'POST';
    return SimpleAutocomplete.send(url, callback, options);
  };

  // Add an event to an element. Return the handler.
  SimpleAutocomplete.addEventListener = function (element, eventName, handler, context) {
    var elements = element === document || element.tagName ? [element] : element;
    var names = eventName.split(/\s+/);

    if (!document.addEventListener) {
      var callback = handler;
      handler = function (event) {
        event.target = event.target || event.srcElement;
        callback.call(this, event);
      };
    }

    if (context) {
      handler = SimpleAutocomplete.bind(handler, context);
    }

    for (var j = 0, m = elements.length; j < m; j++) {
      element = elements[j];
      for (var i = 0, l = names.length; i < l; i++) {
        eventName = names[i];
        if (element.addEventListener) {
          element.addEventListener(eventName, handler, false);
        }
        else if (element.attachEvent) {
          element.attachEvent('on' + eventName, handler);
        }
        else {
          element['on' + eventName] = handler;
        }
      }
    }

    return handler;
  };

  // Remove an event from an element.
  SimpleAutocomplete.removeEventListener = function (element, eventName, handler) {
    var elements = element === document || element.tagName ? [element] : element;
    var names = eventName.split(/\s+/);

    for (var j = 0, m = elements.length; j < m; j++) {
      element = elements[j];
      for (var i = 0, l = names.length; i < l; i++) {
        eventName = names[i];
        if (element.removeEventListener) {
          element.removeEventListener(eventName, handler, false);
        }
        else if (element.detachEvent) {
          element.detachEvent('on' + eventName, handler);
        }
        else {
          element['on' + eventName] = null;
        }
      }
    }
  };

  // Prevent event default behavior.
  SimpleAutocomplete.preventDefault = function (event) {
    if (typeof event.preventDefault !== 'undefined') {
      event.preventDefault();
    }
    else {
      event.returnValue = false;
    }
  };

  // Get a css style of an element. (Possible unexpected results in IE8).
  SimpleAutocomplete.getStyle = function (element, property, pseudoElement) {
    if (window.getComputedStyle) {
      return window.getComputedStyle(element, pseudoElement)[property];
    }
    else if (document.defaultView && document.defaultView.getComputedStyle) {
      return document.defaultView.getComputedStyle(element, pseudoElement)[property];
    }
    else if (element.currentStyle) {
      return element.currentStyle[property];
    }
    else {
      return element.style[property];
    }
  };

  // Handle DOM element classes.
  SimpleAutocomplete.hasClass = function (element, className) {
    if (element && typeof element.className !== 'undefined' && element.className.length > 0) {
      return element.className === className || (' ' + element.className + ' ').indexOf(' ' + className + ' ') !== -1;
    }
    return false;
  };
  SimpleAutocomplete.addClass = function (element, className) {
    if (element && typeof element.className !== 'undefined' && !SimpleAutocomplete.hasClass(element, className)) {
      var current = SimpleAutocomplete.trim(element.className);
      element.className = current + (current.length > 0 ? ' ' : '') + className;
    }
  };
  SimpleAutocomplete.removeClass = function (element, className) {
    if (element && typeof element.className !== 'undefined' && element.className.length > 0) {
      element.className = SimpleAutocomplete.trim((' ' + element.className + ' ').replace(' ' + className + ' ', ''));
    }
  };

  // Trim a string.
  SimpleAutocomplete.trim = function (string) {
    return string.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };

  // Escape a string to use in regexp.
  SimpleAutocomplete.escapeRegExp = function (string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  // Remove diacritics from string.
  SimpleAutocomplete.diacritics = [
    [/[\300-\306]/g, 'A'],
    [/[\340-\346]/g, 'a'],
    [/[\310-\313]/g, 'E'],
    [/[\350-\353]/g, 'e'],
    [/[\314-\317]/g, 'I'],
    [/[\354-\357]/g, 'i'],
    [/[\322-\330]/g, 'O'],
    [/[\362-\370]/g, 'o'],
    [/[\331-\334]/g, 'U'],
    [/[\371-\374]/g, 'u'],
    [/[\321]/g, 'N'],
    [/[\361]/g, 'n'],
    [/[\307]/g, 'C'],
    [/[\347]/g, 'c']
  ];
  SimpleAutocomplete.lowerCaseDiacritics = [
    [/[\340-\346]/g, 'a'],
    [/[\350-\353]/g, 'e'],
    [/[\354-\357]/g, 'i'],
    [/[\362-\370]/g, 'o'],
    [/[\371-\374]/g, 'u'],
    [/[\361]/g, 'n'],
    [/[\347]/g, 'c']
  ];
  SimpleAutocomplete.removeDiacritics = function (string, full) {
    var diacritics = full ? SimpleAutocomplete.diacritics : SimpleAutocomplete.lowerCaseDiacritics;
    string = full ? string : string.toLowerCase();
    for (var i = 0, l = diacritics.length; i < l; i++) {
      string = string.replace(diacritics[i][0], diacritics[i][1]);
    }
    return string;
  };

  // Merge properties of objects passed as arguments into target.
  SimpleAutocomplete.extend = function (target) {
    var sources = Array.prototype.slice.call(arguments, 1);
    for (var i = 0, l = sources.length; i < l; i++) {
      var source = sources[i] || {};
      for (var property in source) {
        if (source.hasOwnProperty(property)) {
          target[property] = source[property];
        }
      }
    }
    return target;
  };

  /**
   * Counter for the selector Ids.
   */
  SimpleAutocomplete.nextSelectorId = 1;

  /**
   * Simple Class.
   */
  SimpleAutocomplete.Class = function () {
    // Empty.
  };

  // Extend a class.
  SimpleAutocomplete.Class.extend = function (properties) {
    properties = properties || {};

    // Extended class.
    var NewClass = function () {
      if (this.initialize) {
        this.initialize.apply(this, arguments);
      }
    };

    // Instantiate the class without calling the constructor.
    var Instance = function () {
      // Empty.
    };
    Instance.prototype = this.prototype;

    var prototype = new Instance();
    prototype.constructor = NewClass;

    NewClass.prototype = prototype;

    // Inherit the parent's static properties.
    for (var property in this) {
      if (this.hasOwnProperty(property) && property !== 'prototype') {
        NewClass[property] = this[property];
      }
    }

    // Merge static properties.
    if (properties.statics) {
      SimpleAutocomplete.extend(NewClass, properties.statics);
      delete properties.statics;
    }

    // Merge includes.
    if (properties.includes) {
      SimpleAutocomplete.extend.apply(null, [prototype].concat(properties.includes));
      delete properties.includes;
    }

    // Merge options.
    if (properties.options && prototype.options) {
      properties.options = SimpleAutocomplete.extend({}, prototype.options, properties.options);
    }

    // Merge properties into the prototype.
    SimpleAutocomplete.extend(prototype, properties);

    // Parent.
    NewClass._super = this.prototype;

    NewClass.prototype.setOptions = function (options) {
      this.options = SimpleAutocomplete.extend({}, this.options, options);
    };

    return NewClass;
  };

  /**
   * Autocomplete Class.
   */
  SimpleAutocomplete.Autocomplete = SimpleAutocomplete.Class.extend({
    options: {
      // Returned the cache key for a query.
      cacheKey: function (query) {
        // Basic implementation enforces case and accent insensitivity.
        return 'query_' + SimpleAutocomplete.removeDiacritics(query);
      },

      // Request data from a URL.
      requestURL: function (url, callback) {
        return SimpleAutocomplete.get(url, callback);
      },

      // Pre-process the value of the input element.
      input: function (query) {
        return query;
      },

      // Called before the data is loaded. Prepare the source.
      prepare: function (query, source) {
        if (typeof source === 'string') {
          return source.replace('%QUERY', encodeURI(query));
        }
        else if (source instanceof Array) {
          return this.match(query, source);
        }
        else {
          return source;
        }
      },

      // Called after the data is loaded. The returned data should be an array.
      filter: function (query, data) {
        return typeof data === 'string' ? JSON.parse(data) : data;
      },

      // Called when a suggestion is rendered in the selector.
      render: function (query, suggestion) {
        var label = 'undefined';
        if (typeof suggestion === 'string') {
          label = suggestion;
        }
        else if (suggestion.label) {
          label = suggestion.label;
        }
        else if (suggestion.value) {
          label = suggestion.value;
        }
        return this.highlight(query, label);
      },

      // Called when a suggestion is selected in the selector.
      select: function (suggestion) {
        var value = '';
        if (typeof suggestion === 'string') {
          value = suggestion;
        }
        else if (suggestion.value) {
          value = suggestion.value;
        }
        this.setQuery(value);
        this.hideSelector();
      },

      // Maximum number of suggestions to be displayed in the selector.
      limit: 10,
      // Data load delay. Used to prevent excessive loading while typing.
      delay: 150,
      // Minimun length of the query in order to load the data.
      minLength: 1,
      // Lock the enter key, preventing default behavior.
      lockEnter: true,
      // Maximum number of concurrent requests.
      maxRequests: 8,
      // Automatically select the first entry when the selector opens.
      autoSelectFirst: true,
      // Set the focus on the input element when the selector opens.
      focusOnOpen: true,
      // Disable cache, keeping only the data for the current query.
      disableCache: false,
      // Namespace for the classes, ids and attributes.
      namespace: 'simpleautocomplete'
    },

    // Constructor.
    // Element can be a DOM element, or a selector (class, id etc.).
    // Source can be a string, an array, a function etc.
    initialize: function (element, source, options) {
      // Minimum support.
      if (typeof document.querySelector === 'undefined') {
        this.handleError('Unsupported browser.');
        return;
      }

      this.setOptions(options);

      this.source = source;
      this.requests = [];
      this.cache = {};
      this.listeners = {};
      this.preventBlur = false;
      this.suggestions = null;
      this.query = '';

      // Bind event handlers.
      this.handleFocus = SimpleAutocomplete.bind(this.handleFocus, this);
      this.handleKeyPress = SimpleAutocomplete.bind(this.handleKeyPress, this);
      this.handleSuggestionOver = SimpleAutocomplete.bind(this.handleSuggestionOver, this);
      this.handleSuggestionSelect = SimpleAutocomplete.bind(this.handleSuggestionSelect, this);

      // Bind options callbacks.
      this.options.cacheKey = SimpleAutocomplete.bind(this.options.cacheKey, this);
      this.options.requestURL = SimpleAutocomplete.bind(this.options.requestURL, this);
      this.options.input = SimpleAutocomplete.bind(this.options.input, this);
      this.options.prepare = SimpleAutocomplete.bind(this.options.prepare, this);
      this.options.filter = SimpleAutocomplete.bind(this.options.filter, this);
      this.options.render = SimpleAutocomplete.bind(this.options.render, this);
      this.options.select = SimpleAutocomplete.bind(this.options.select, this);

      // Bind other functions.
      this.removeRequest = SimpleAutocomplete.bind(this.removeRequest, this);
      this.focus = SimpleAutocomplete.bind(this.focus, this);

      // Get the element.
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }

      if (element && element.tagName === 'INPUT') {
        SimpleAutocomplete.addEventListener(element, 'focus blur', this.handleFocus);
        SimpleAutocomplete.addEventListener(element, 'keydown keyup', this.handleKeyPress);
        this.setElement(element);
        this.createSelector();
      }
      else {
        this.handleError('Invalid element.');
      }
    },

    // Should be called to clean up the instance before deleting it.
    destroy: function () {
      var element = this.element;
      var selector = this.selector;

      if (element) {
        SimpleAutocomplete.removeEventListener(element, 'focus blur', this.handleFocus);
        SimpleAutocomplete.removeEventListener(element, 'keydown keyup', this.handleKeyPress);
      }

      if (selector) {
        SimpleAutocomplete.removeEventListener(selector, 'mouseover mouseout', this.handleSuggestionOver);
        SimpleAutocomplete.removeEventListener(selector, 'mousedown', this.handleSuggestionSelect);
        SimpleAutocomplete.removeEventListener(selector, 'mouseup', this.focus);
        selector.parentNode.removeChild(selector);
      }

      for (var i = 0, l = this.requests.length; i < l; i++) {
        if (this.requests[i]) {
          this.requests[i].abort();
        }
      }

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.source = null;
      this.requests = null;
      this.cache = null;
      this.listeners = null;
      this.element = null;
      this.selector = null;
      this.suggestions = null;
      this.query = null;
    },

    setElement: function (element) {
      this.element = element;
    },

    getElement: function () {
      return this.element || null;
    },

    // Load data from a URL.
    loadURL: function (query, url, cacheKey) {
      var context = this;

      // Abort the oldest request if above the number of allowed requests.
      if (this.requests.length > this.options.maxRequests) {
        this.requests.shift().abort();
      }

      var callback = function (success, data) {
        context.removeRequest(this);

        if (success) {
          context.handleData(query, data, cacheKey);
        }
        else {
          context.handleError(data);
        }
      };

      this.requests.push(this.options.requestURL(url, callback));
    },

    // Remove a request from the list of requests.
    removeRequest: function (xhr) {
      var requests = this.requests;
      for (var i = 0, l = requests.length; i < l; i++) {
        if (requests[i] === xhr) {
          return requests.splice(i, 1);
        }
      }
    },

    // Load the data for a query.
    loadData: function (query, cacheKey) {
      // Prepare the data.
      var source = this.options.prepare(query, this.source);

      // Do nothing if source is undefined or null.
      if (typeof source === 'undefined' || source === null) {
        return;
      }

      // If source is a string we assume it's a URL.
      if (typeof source === 'string') {
        this.loadURL(query, source, cacheKey);
      }
      // Otherwise load the data directly.
      else {
        this.handleData(query, source, cacheKey);
      }
    },

    // Data load error callback.
    handleError: function (error) {
      this.fire('error', {error: error || true});
    },

    // Data load success callback.
    handleData: function (query, data, cacheKey) {
      // Filter the data. Must return an array.
      // The default implementation expects an array of strings
      // or objects with at least a value property and an optional label one.
      data = this.options.filter(query, data);
      this.setCache(cacheKey, data);
      this.display();
    },

    // Handle the query.
    handleQuery: function (query) {
      if (query === this.query) {
        return;
      }
      this.query = query;

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.hideSelector();

      // Pre-process the value of the input element.
      query = this.options.input(query);

      // Only process the query if it's long enough.
      if (query.length >= this.options.minLength) {
        var cacheKey = this.options.cacheKey(query);

        // Load from the cache if possible.
        if (this.isCached(cacheKey)) {
          this.display();
        }
        else {
          // Delay the loading process to prevent excessive requests.
          if (this.options.delay > 0) {
            this.timeout = SimpleAutocomplete.setTimeout.call(this, this.loadData, this.options.delay, query, cacheKey);
          }
          else {
            this.loadData(query, cacheKey);
          }
        }
      }
    },

    // Handle focus on the input element.
    handleFocus: function (event) {
      if (this.enabled === false) {
        return;
      }

      if (event.type === 'focus' && !this.selectorIsOpen()) {
        this.handleQuery(event.target.value);
      }
      else if (event.type === 'blur' && this.preventBlur === false && this.selectorIsOpen()) {
        this.hideSelector();
      }
    },

    // Input element key down and up callback.
    handleKeyPress: function (event) {
      if (this.enabled === false) {
        return;
      }

      var key = event.which || event.keyCode;
      var keyCodes = SimpleAutocomplete.KeyCodes;

      if (event.type === 'keydown') {
        if (!this.selectorIsOpen()) {
          return;
        }

        switch (key) {
          case keyCodes.ENTER:
            SimpleAutocomplete.preventDefault(event);
            this.handleSuggestionSelect({
              target: this.getSelectedSuggestion()
            });
            break;

          case keyCodes.ESC:
            SimpleAutocomplete.preventDefault(event);
            this.clear();
            break;

          case keyCodes.UP:
            SimpleAutocomplete.preventDefault(event);
            this.selectSuggestion(-1);
            break;

          case keyCodes.DOWN:
            SimpleAutocomplete.preventDefault(event);
            this.selectSuggestion(1);
            break;
        }
      }
      else if (event.type === 'keyup') {
        switch (key) {
          case keyCodes.TAB:
          case keyCodes.ENTER:
          case keyCodes.ESC:
          case keyCodes.END:
          case keyCodes.HOME:
          case keyCodes.LEFT:
          case keyCodes.UP:
          case keyCodes.RIGHT:
          case keyCodes.DOWN:
            break;

          default:
            this.handleQuery(event.target.value);
        }
      }

      if (key === 13 && this.options.lockEnter) {
        SimpleAutocomplete.preventDefault(event);
        this.fire('enter', event);
      }
      return false;
    },

    // Selector/suggestions mouse over/out callback.
    handleSuggestionOver: function (event) {
      var element = event.target;
      var selector = this.selector;

      this.preventBlur = event.type === 'mouseover';

      if (element === selector) {
        return;
      }

      while (element && element.parentNode !== selector) {
        element = element.parentNode;
      }

      if (element && element.parentNode === selector) {
        if (event.type === 'mouseout') {
          element.removeAttribute('aria-selected');
        }
        else if (event.type === 'mouseover') {
          this.unselectSuggestions();
          element.setAttribute('aria-selected', true);
        }
      }
    },

    // Suggestion selection callback.
    handleSuggestionSelect: function (event) {
      var element = event.target;
      var selector = this.selector;

      while (element && element.parentNode !== selector) {
        element = element.parentNode;
      }

      if (element && element.parentNode === selector) {
        var suggestion = this.getSuggestion(element);
        if (suggestion) {
          this.options.select(suggestion);
          this.fire('selected', suggestion);
        }
      }
    },

    // Set the focus on the input element.
    focus: function () {
      if (this.element) {
        this.element.focus();
      }
      return this;
    },

    // Display selector.
    display: function () {
      var query = this.getQuery();
      var data = this.getCache(this.options.cacheKey(query));

      if (data && data.length) {
        var selector = this.selector;
        var selectorId = selector.id;
        var fragment = document.createDocumentFragment();
        var options = this.options;
        var namespace = options.namespace;
        var limit = options.limit < data.length ? options.limit : data.length;
        var render = options.render;
        var suggestions = [];

        // Empty the selector.
        while (selector.lastChild) {
          selector.removeChild(selector.lastChild);
        }

        // Add suggestions.
        for (var i = 0; i < limit; i++) {
          var suggestion = data[i];
          suggestions.push(suggestion);

          var listItem = document.createElement('li');
          listItem.setAttribute('id', selectorId + '-suggestion-' + i);
          listItem.setAttribute('role', 'option');
          listItem.setAttribute('tabindex', -1);
          listItem.className = namespace + '-suggestion';
          listItem.innerHTML = render(query, suggestion);
          fragment.appendChild(listItem);
        }

        selector.appendChild(fragment);
        this.suggestions = suggestions;
        this.showSelector();
      }
      else {
        this.hideSelector();
      }
      return this;
    },

    // Open the selector.
    showSelector: function () {
      if (this.selector) {
        // Select first entry.
        if (this.options.autoSelectFirst === true) {
          this.selectSuggestion(1);
        }
        // Show the selector.
        this.selector.removeAttribute('hidden');
        this.selector.style.display = 'block';
        // Focus the input element.
        if (this.options.focusOnOpen === true) {
          this.focus();
        }
        // Fire the 'opened' event.
        this.fire('opened');
      }
      return this;
    },

    // Close the selector.
    hideSelector: function () {
      if (this.selector) {
        this.selector.scrollTop = 0;
        this.selector.setAttribute('hidden', '');
        this.selector.style.display = 'none';
        this.fire('closed');
      }
      return this;
    },

    // Build the selector.
    createSelector: function () {
      if (!this.selector) {
        // The input element needs to be in the DOM already otherwise we
        // cannot add the selector next to it.
        if (!this.element.parentNode) {
          this.handleError('Element not in the DOM.');
          return;
        }

        var selector = document.createElement('ul');
        var namespace = this.options.namespace;
        var elementId = this.element.id || SimpleAutocomplete.nextSelectorId++;
        var selectorId = namespace + '-selector-' + elementId;

        selector.className = namespace + '-selector';
        selector.setAttribute('role', 'listbox');
        selector.setAttribute('id', selectorId);
        selector.setAttribute('hidden', '');
        selector.style.display = 'none';
        selector.style.overflowY = 'auto';

        // Update the input element.
        SimpleAutocomplete.addClass(this.element, namespace + '-input');
        this.element.setAttribute('aria-controls', selectorId);
        this.element.setAttribute('aria-autocomplete', 'list');
        this.element.setAttribute('role', 'textbox');

        this.selector = selector;

        SimpleAutocomplete.addEventListener(selector, 'mouseover mouseout', this.handleSuggestionOver);
        SimpleAutocomplete.addEventListener(selector, 'mousedown', this.handleSuggestionSelect);
        SimpleAutocomplete.addEventListener(selector, 'mouseup', this.focus);

        // Add after the input.
        this.element.parentNode.insertBefore(selector, this.element.nextSibling);
      }
    },

    // Get the selector.
    getSelector: function () {
      return this.selector;
    },

    // Indicate whether the selector is shown or not.
    selectorIsOpen: function () {
      return !this.selector.hasAttribute('hidden');
    },

    // Set the value of the input element.
    setQuery: function (query) {
      if (this.element) {
        this.element.value = query;
      }
      return this;
    },

    // Get the value form the input element.
    getQuery: function () {
      return this.element ? this.element.value : '';
    },

    // Get the suggestion data from the corresponding DOM element.
    getSuggestion: function (element) {
      var index = this.getSuggestionIndex(element);
      if (index !== null && this.suggestions) {
        return this.suggestions[index] || null;
      }
      return null;
    },

    // Select a suggestion from index + offset.
    // If index is not defined, use the current selection.
    selectSuggestion: function (direction) {
      var element = this.getSelectedSuggestion();
      var selector = this.selector;
      var children = selector.children;

      if (direction === -1) {
        element = (element && element.previousSibling) || children[children.length - 1];
      }
      else {
        element = (element && element.nextSibling) || children[0];
      }

      if (element) {
        this.unselectSuggestions();
        this.element.setAttribute('aria-activedescendant', element.id);
        element.setAttribute('aria-selected', 'true');

        // Handle scrolling inside the selector.
        var selectorBounds = selector.getBoundingClientRect();
        var elementBounds = element.getBoundingClientRect();
        var selectorHeight = selectorBounds.bottom - selectorBounds.top;
        var elementHeight = elementBounds.bottom - elementBounds.top;
        var heightDiff = selectorHeight - elementHeight;
        var scrollDiff = element.offsetTop - selector.scrollTop;
        var paddingTop = parseInt(SimpleAutocomplete.getStyle(selector, 'paddingTop'), 10) || 0;

        if (scrollDiff > heightDiff) {
          selector.scrollTop = element.offsetTop + paddingTop - heightDiff;
        }
        else if (scrollDiff < 0) {
          selector.scrollTop = element.offsetTop - paddingTop;
        }
      }
    },

    // Unselect all the suggestions.
    unselectSuggestions: function () {
      var elements = this.selector.children;
      for (var i = 0, l = elements.length; i < l; i++) {
        elements[i].removeAttribute('aria-selected');
      }
    },

    // Get the currently selected suggestion (first one).
    getSelectedSuggestion: function () {
      return this.selector.querySelector('[aria-selected]');
    },

    // Get the suggestion key from the corresponding DOM element.
    getSuggestionIndex: function (element) {
      if (element) {
        var id = element.id;
        return parseInt(id.substr(id.lastIndexOf('-') + 1), 10);
      }
      return null;
    },

    // Add data to the cache with the query as key.
    setCache: function (cacheKey, data) {
      if (!this.isCached(cacheKey)) {
        if (this.options.disableCache) {
          // Reset the cache to keep only the data for the current query.
          this.cache = {};
        }
        this.cache[cacheKey] = data || [];
      }
    },

    // Get data from the cache.
    getCache: function (cacheKey) {
      return this.isCached(cacheKey) ? this.cache[cacheKey] : null;
    },

    // Check if the query's data is cached.
    isCached: function (cacheKey) {
      return this.cache.hasOwnProperty(cacheKey);
    },

    // Clear the input element and close the selector.
    clear: function () {
      this.setQuery('');
      this.hideSelector();
      return this;
    },

    // Disable the widget.
    disable: function () {
      this.enabled = false;
      return this;
    },

    // Enable the widget.
    enable: function () {
      this.enabled = true;
      return this;
    },

    // Add a listener to the autocomplete events.
    on: function (eventName, handler) {
      var names = eventName.split(/\s+/);
      for (var i = 0, l = names.length; i < l; i++) {
        eventName = names[i];
        if (!this.listeners[eventName]) {
          this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(handler);
      }
      return this;
    },

    // Remove a listener.
    off: function (eventName, handler) {
      var names = eventName.split(/\s+/);
      for (var i = 0, l = names.length; i < l; i++) {
        eventName = names[i];
        var listeners = this.listeners[eventName];
        if (listeners) {
          for (var j = listeners.length - 1; j >= 0; j--) {
            if (listeners[j] === handler) {
              this.listeners[eventName].splice(j, 1);
            }
          }
        }
      }
      return this;
    },

    // Fire an event. Execute the listeners' callbacks.
    fire: function (eventName, data) {
      var listeners = this.listeners[eventName];
      if (listeners) {
        var event = {
          type: eventName,
          target: this
        };
        if (data) {
          event.data = data;
        }

        for (var i = 0, l = listeners.length; i < l; i++) {
          listeners[i](event);
        }
      }
      return this;
    },

    // Highlight the query terms in the suggestions.
    highlight: function (query, label) {
      query = SimpleAutocomplete.trim(query);
      if (query !== '') {
        var removeDiacritics = SimpleAutocomplete.removeDiacritics;
        var escapeRegExp = SimpleAutocomplete.escapeRegExp;
        var terms = escapeRegExp(removeDiacritics(query)).split(/\s+/);
        var string = removeDiacritics(label);
        var matcher = new RegExp('(' + terms.join('|') + ')', 'g');
        var result = null;
        var replacements = [];

        while ((result = matcher.exec(string)) !== null) {
          replacements.push(escapeRegExp(label.substr(result.index, result[1].length)));
        }
        if (replacements.length) {
          return label.replace(new RegExp('(' + replacements.join('|') + ')', 'g'), '<span>$1</span>');
        }
      }
      return label;
    },

    // Find the suggestions matching the query terms from the source.
    match: function (query, source) {
      var removeDiacritics = SimpleAutocomplete.removeDiacritics;
      var escapeRegExp = SimpleAutocomplete.escapeRegExp;
      var trim = SimpleAutocomplete.trim;
      var terms = escapeRegExp(removeDiacritics(trim(query))).split(/\s+/);
      var limit = this.options.limit < source.length ? this.options.limit : source.length;
      var matchers = [];
      var data = [];

      for (var i = 0, l = terms.length; i < l; i++) {
        matchers.push(new RegExp(terms[i]));
      }

      // Check if a suggestion contains all the query terms.
      var match = function (string, matchers) {
        for (var i = 0, l = matchers.length; i < l; i++) {
          if (string.match(matchers[i]) === null) {
            return false;
          }
        }
        return true;
      };

      for (var i = 0, l = source.length; i < l; i++) {
        if (data.length < limit) {
          var item = source[i];
          var string = '';
          if (typeof item === 'string') {
            string = item;
          }
          else if (item.value) {
            string = item.value;
          }
          if (string !== '' && match(removeDiacritics(string), matchers)) {
            data.push(item);
          }
        }
        else {
          break;
        }
      }

      return data;
    }
  });

  // Shortcut for instantiating a SimpleAutocomplete.
  SimpleAutocomplete.autocomplete = function (element, source, options) {
    return new SimpleAutocomplete.Autocomplete(element, source, options);
  };

})();
