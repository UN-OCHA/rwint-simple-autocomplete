(function () {

'use strict';

// Keep a reference of the global object (window or exports).
var root = window;

// SimpleAutocomplete.
var SimpleAutocomplete = root.SimpleAutocomplete = {};

// Bind a function to a context.
SimpleAutocomplete.bind = function (fn, context) {
  var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
  return function () {
    return fn.apply(context, args || arguments);
  };
};

// Implementation of setTimeout that deals with this and arguments.
SimpleAutocomplete.setTimeout = function (callback, delay) {
  var context = this, args = Array.prototype.slice.call(arguments, 2);
  return setTimeout(function () { callback.apply(context, args); }, delay);
};

// Send a GET request to a url.
SimpleAutocomplete.get = function (url, callback, options) {
  var xhr = new XMLHttpRequest(),
      success = 200, handler;

  if (!('onload' in xhr)) {
    if (window.XDomainRequest) {
      xhr = new window.XDomainRequest();
      success = undefined;
    }
    else {
      callback(false, 'Browser not supported.');
      return null;
    }
  }

  // Make sure the callback is executed only once by setting it to noop.
  handler = function () {
    callback.apply(null, arguments);
    callback = function () {};
  };

  xhr.onprogress = function () {};

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

  // Extra parameters and overrides.
  SimpleAutocomplete.extend(xhr, options);

  xhr.open('GET', url, true);
  xhr.send(null);

  return xhr;
};

// Add an event to an element. Return the handler.
SimpleAutocomplete.addEventListener = function (element, eventName, handler, context) {
  var names = eventName.split(/\s+/), i, l;

  if (context) {
    handler = SimpleAutocomplete.bind(handler, context);
  }

  for (i = 0, l = names.length; i < l; i++) {
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

  return handler;
};

// Remove an event from an element.
SimpleAutocomplete.removeEventListener = function (element, eventName, handler) {
  var names = eventName.split(/\s+/), i, l;

  for (i = 0, l = names.length; i < l; i++) {
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
};

// Get a css style of an element. (Possible unexpected results in IE8).
SimpleAutocomplete.getStyle = function (element, property, pseudoElement) {
  if (window.getComputedStyle) {
    return window.getComputedStyle(element, pseudoElement)[property];
  }
  else if (document.defaultView.getComputedStyle) {
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
  if (element && element.className.length > 0) {
    return element.className === className || (' ' + element.className + ' ').indexOf(' ' + className + ' ') !== -1;
  }
  return false;
};
SimpleAutocomplete.addClass = function (element, className) {
  if (element && !SimpleAutocomplete.hasClass(element, className)) {
    element.className += (element.className.length > 0 ? ' ' : '') + className;
  }
};
SimpleAutocomplete.removeClass = function (element, className) {
  if (element && element.className.length > 0) {
    element.className = SimpleAutocomplete.trim((' ' + element.className + ' ').replace(' ' + className + ' ', ''));
  }
};

// Trim a string.
SimpleAutocomplete.trim = function (string){
  var ws = /\s/, i = string.length, result = true;
  string = string.replace(/^\s\s*/, '');
  while (result) { result = ws.test(string.charAt(--i)); }
  return string.slice(0, i + 1);
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
  var diacritics = full ? SimpleAutocomplete.diacritics : SimpleAutocomplete.lowerCaseDiacritics, i, l;
  string = full ? string : string.toLowerCase();
  for (i = 0, l = diacritics.length; i < l; i++) {
    string = string.replace(diacritics[i][0], diacritics[i][1]);
  }
  return string;
};

// Merge properties of objects passed as arguments into target.
SimpleAutocomplete.extend = function (target) {
  var sources = Array.prototype.slice.call(arguments, 1),
      i, l, property, source;
  for (i = 0, l = sources.length; i < l; i++) {
    source = sources[i] || {};
    for (property in source) {
      if (source.hasOwnProperty(property)) {
        target[property] = source[property];
      }
    }
  }
  return target;
};

/**
* Simple Class.
*/
SimpleAutocomplete.Class = function () {};

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
  var Instance = function () {};
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
    lockEnter: true
  },

  // Constructor.
  // Element can be a DOM element, a class or an ID.
  // Source can be a string, an array, a function etc.
  initialize: function (element, source, options) {
    this.setOptions(options);

    this.source = source;
    this.cache = {};
    this.listeners = {};

    // Bind event handlers.
    this.handleFocus = SimpleAutocomplete.bind(this.handleFocus, this);
    this.handleKeyPress = SimpleAutocomplete.bind(this.handleKeyPress, this);
    this.handleSuggestionOver = SimpleAutocomplete.bind(this.handleSuggestionOver, this);
    this.handleSuggestionSelect = SimpleAutocomplete.bind(this.handleSuggestionSelect, this);

    // Bind options callbacks.
    this.options.cacheKey = SimpleAutocomplete.bind(this.options.cacheKey, this);
    this.options.input = SimpleAutocomplete.bind(this.options.input, this);
    this.options.prepare = SimpleAutocomplete.bind(this.options.prepare, this);
    this.options.filter = SimpleAutocomplete.bind(this.options.filter, this);
    this.options.render = SimpleAutocomplete.bind(this.options.render, this);
    this.options.select = SimpleAutocomplete.bind(this.options.select, this);

    // Get the element.
    if (typeof element === 'string') {
      var string = element,
          prefix = string.substr(0, 1);

      element = null;
      // Class name.
      if (prefix === '.') {
        string = string.substr(1);
        if (document.getElementsByClassName) {
          element = document.body.getElementsByClassName(string)[0];
        }
        else {
          var inputs = document.body.getElementsByTagName('INPUT'),
              i, l, input, hasClass = SimpleAutocomplete.hasClass;
          for (i = 0, l = inputs.length; i < l; i++) {
            input = inputs[i];
            if (hasClass(input, string)) {
              element = input;
              break;
            }
          }
        }
      }
      // Or Element ID.
      else {
        element = document.getElementById(prefix === '#' ? string.substr(1) : string);
      }
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
    var element = this.element,
        selector = this.selector;

    if (element) {
      SimpleAutocomplete.removeEventListener(element, 'focus blur', this.handleFocus);
      SimpleAutocomplete.removeEventListener(element, 'keydown keyup', this.handleKeyPress);
    }

    if (selector) {
      SimpleAutocomplete.removeEventListener(selector, 'mouseover mouseout', this.handleSuggestionOver);
      SimpleAutocomplete.removeEventListener(selector, 'mousedown', this.handleSuggestionSelect);
      selector.parentNode.removeChild(selector);
    }

    if (this.xhr) {
      this.xhr.abort();
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.source = null;
    this.xhr = null;
    this.cache = null;
    this.listeners = null;
    this.element = null;
    this.selector = null;
    this.suggestions = null;
    this.selection = null;
  },

  setElement: function (element) {
    this.element = element;
  },

  getElement: function () {
    return this.element ? this.element : null;
  },

  // Load the data for a query.
  loadData: function (query, cacheKey) {
    // Prepare the data.
    var source = this.options.prepare(query, this.source),
        context = this;

    // Do nothing if source is null.
    if (source === null) {
      return;
    }

    // If source is a string we assume it's a URL.
    if (typeof source === 'string') {
      if (this.xhr) {
        this.xhr.abort();
      }

      var callback = function (success, data) {
        if (success) {
          context.handleData(query, data, cacheKey);
        }
        else {
          context.handleError(data);
        }
      };

      this.xhr = SimpleAutocomplete.get(source, callback);
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
    if (event.type === 'focus') {
      this.handleQuery(event.target.value);
    }
    else {
      this.hideSelector();
    }
  },

  // Input element key down and up callback.
  handleKeyPress: function (event) {
    var key = event.witch ? event.witch : event.keyCode;
    if (event.type === 'keydown') {
      switch (key) {
        case 9:
        case 13:
          this.handleSuggestionSelect({
            target: this.getSelectedSuggestion()
          });
          break;

        case 38:
          this.selectSuggestion(null, -1);
          break;

        case 40:
          this.selectSuggestion(null, 1);
          break;
      }
    }
    else if (event.type === 'keyup') {
      if (key !== 13 && key !== 9 && key !== 38 && key !== 40) {
        this.handleQuery(event.target.value);
      }
    }

    if (key === 13 && this.options.lockEnter) {
      event.preventDefault();
      this.fire('enter', event);
    }
    return false;
  },

  // Selector/suggestions mouse over/out callback.
  handleSuggestionOver: function (event) {
    var element = event.target,
        hasClass = SimpleAutocomplete.hasClass;

    if (hasClass(event.target, 'autocomplete-selector')) {
      return;
    }
    else if (!hasClass(element, 'autocomplete-suggestion')) {
      while ((element = element.parentNode) !== null) {
        if (hasClass(element, 'autocomplete-suggestion')) {
          break;
        }
        else if (hasClass(event.target, 'autocomplete-selector')) {
          return;
        }
      }
    }

    if (element) {
      if (event.type === 'mouseout') {
        SimpleAutocomplete.removeClass(element, 'autocomplete-suggestion-selected');
      }
      else if (event.type === 'mouseover') {
        this.unselectSuggestions();
        SimpleAutocomplete.addClass(element, 'autocomplete-suggestion-selected');
      }
    }
  },

  // Suggestion selection callback.
  handleSuggestionSelect: function (event) {
    var element = event.target;
    if (element && SimpleAutocomplete.hasClass(element, 'autocomplete-suggestion')) {
      var suggestion = this.getSuggestion(element);
      this.options.select(suggestion);
      this.fire('selected', suggestion);
    }
  },

  // Display selector.
  display: function () {
    var query = this.getQuery(),
        data = this.getCache(this.options.cacheKey(query));

    if (data && data.length) {
      var limit = this.options.limit < data.length ? this.options.limit : data.length,
          render = this.options.render,
          content = [],
          suggestions = {length: limit + 1},
          suggestion, i, key;

      // Add suggestions.
      for (i = 0; i < limit; i++) {
        suggestion = data[i];
        key = 'autocomplete-suggestion-' + (i + 1);
        content.push('<div class="autocomplete-suggestion ' + key + '">' + render(query, suggestion) + '</div>');
        suggestions[key] = suggestion;
      }

      this.suggestions = suggestions;
      this.selector.innerHTML = content.join("\n");
      this.showSelector();
    }
    else {
      this.hideSelector();
    }
  },

  // Open the selector.
  showSelector: function () {
    if (this.selector) {
      this.selector.style.display = 'block';
      this.fire('opened');
    }
  },

  // Close the selector.
  hideSelector: function () {
    if (this.selector) {
      this.selector.style.display = 'none';
      this.fire('closed');
    }
  },

  // Build the selector.
  createSelector: function () {
    if (!this.selector) {
      var selector = document.createElement('div');

      selector.className = 'autocomplete-selector';
      selector.style.display = 'none';
      selector.style.overflowY = 'auto';

      this.selector = selector;
      // If available, we keep a reference to the selected suggestions.
      // It's a live HTMLCollection.
      if (selector.getElementsByClassName) {
        this.selection = selector.getElementsByClassName('autocomplete-suggestion-selected');
      }

      this.updateSelector();

      SimpleAutocomplete.addEventListener(selector, 'mouseover mouseout', this.handleSuggestionOver);
      SimpleAutocomplete.addEventListener(selector, 'mousedown', this.handleSuggestionSelect);

      document.body.appendChild(selector);
    }
  },

  // Update the position and size of the selector.
  updateSelector: function () {
    if (this.selector && this.element) {
      var paddingLeft, paddingRight, borderLeft, borderRight,
          bounds = this.element.getBoundingClientRect(),
          selector = this.selector;

      paddingLeft = parseInt(SimpleAutocomplete.getStyle(selector, 'paddingLeft'), 10) || 0;
      paddingRight = parseInt(SimpleAutocomplete.getStyle(selector, 'paddingRight'), 10) || 0;
      borderLeft = parseInt(SimpleAutocomplete.getStyle(selector, 'borderLeftWidth'), 10) || 0;
      borderRight = parseInt(SimpleAutocomplete.getStyle(selector, 'borderRightWidth'), 10) || 0;

      selector.style.position = 'absolute';
      selector.style.left = (bounds.left) + 'px';
      selector.style.top = (bounds.bottom) + 'px';
      selector.style.width = (bounds.right - bounds.left - paddingLeft - paddingRight - borderLeft - borderRight) + 'px';
    }
  },

  // Set the value of the input element.
  setQuery: function (query) {
    if (this.element) {
      this.element.value = query;
    }
  },

  // Get the value form the input element.
  getQuery: function () {
    return this.element ? this.element.value : '';
  },

  // Get the suggestion data from the corresponding DOM element.
  getSuggestion: function (element) {
    if (element && this.suggestions) {
      var key = this.getSuggestionKey(element);
      return key !== null && this.suggestions[key] ? this.suggestions[key] : null;
    }
    return null;
  },

  // Select a suggestion from index + offset.
  // If index is not defined, use the current selection.
  selectSuggestion: function (index, offset) {
    var element = this.getSelectedSuggestion(),
        maxSuggestions = this.suggestions.length,
        selector = this.selector;

    if (!element) {
      if (index === null) {
        index = 0;
      }
    }
    else {
      this.unselectSuggestions();
      if (index === null) {
        index = this.getSuggestionKey(element, true);
      }
    }

    // Loop through the suggestions if necessary.
    index += (offset || 0);
    if (index === 0 || index === maxSuggestions) {
      return;
    }
    else if (index < 0) {
      index = maxSuggestions + index;
    }
    else if (index > maxSuggestions) {
      index = index - maxSuggestions;
    }

    if ((element = selector.children[index - 1])) {
      SimpleAutocomplete.addClass(element, 'autocomplete-suggestion-selected');

      // Handle scrolling inside the selector.
      var selectorBounds = selector.getBoundingClientRect(),
          elementBounds = element.getBoundingClientRect(),
          selectorHeight = selectorBounds.bottom - selectorBounds.top,
          elementHeight = elementBounds.bottom - elementBounds.top,
          heightDiff = selectorHeight - elementHeight,
          scrollDiff = element.offsetTop - selector.scrollTop,
          paddingTop = parseInt(SimpleAutocomplete.getStyle(selector, 'paddingTop'), 10) || 0;

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
    var elements = this.selection ? this.selection : this.selector.children,
        removeClass = SimpleAutocomplete.removeClass,
        i, l;

    for (i = 0, l = elements.length; i < l; i++) {
      removeClass(elements[i], 'autocomplete-suggestion-selected');
    }
  },

  // Get the currently selected suggestion (first one).
  getSelectedSuggestion: function () {
    if (this.selection) {
      return this.selection[0];
    }

    var elements = this.selector.children,
        hasClass = SimpleAutocomplete.hasClass,
        i, l, element;
    for (i = 0, l = elements.length; i < l; i++) {
      element = elements[i];
      if (hasClass(element, 'autocomplete-suggestion-selected')) {
        return element;
      }
    }
    return null;
  },

  // Get the suggestion key from the corresponding DOM element.
  getSuggestionKey: function (element, indexOnly) {
    if (element) {
      var pattern = /autocomplete-suggestion-(\d+)/,
          match = pattern.exec(element.className);
      if (match !== null) {
        return indexOnly ? parseInt(match[1], 10) || 0 : match[0];
      }
    }
    return null;
  },

  // Add data to the cache with the query as key.
  setCache: function (cacheKey, data) {
    if (!this.isCached(cacheKey)) {
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
  },

  // Add a listener to the autocomplete events.
  on: function (eventName, handler) {
    var names = eventName.split(/\s+/), i, l;
    for (i = 0, l = names.length; i < l; i++) {
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
    var names = eventName.split(/\s+/), listeners, i, j, l;
    for (i = 0, l = names.length; i < l; i++) {
      eventName = names[i];
      if ((listeners = this.listeners[eventName])) {
        for (j = listeners.length - 1; j >= 0; j--) {
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
    var listeners = this.listeners[eventName], i, l, event;
    if (listeners) {
      event = {
        type: eventName,
        target: this,
      };
      if (data) {
        event.data = data;
      }

      for (i = 0, l = listeners.length; i < l; i++) {
        listeners[i](event);
      }
    }
  },

  // Highlight the query terms in the suggestions.
  highlight: function (query, label) {
    var removeDiacritics = SimpleAutocomplete.removeDiacritics,
        escape = SimpleAutocomplete.escapeRegExp,
        trim = SimpleAutocomplete.trim,
        terms = escape(removeDiacritics(trim(query))).split(/\s+/),
        string = removeDiacritics(label),
        matcher = new RegExp('(' + terms.join('|') + ')', 'g'),
        result, replacements = [];

    while ((result = matcher.exec(string)) !== null) {
      replacements.push(escape(label.substr(result.index, result[1].length)));
    }
    return label.replace(new RegExp('(' + replacements.join('|') + ')', 'g'), '<strong>$1</strong>');
  },

  // Find the suggestions matching the query terms from the source.
  match: function (query, source) {
    var removeDiacritics = SimpleAutocomplete.removeDiacritics,
        escape = SimpleAutocomplete.escapeRegExp,
        trim = SimpleAutocomplete.trim,
        terms = escape(removeDiacritics(trim(query))).split(/\s+/),
        limit = this.options.limit < source.length ? this.options.limit : source.length,
        match, item, string, i, l,
        matchers = [], data = [];

    for (i = 0, l = terms.length; i < l; i++) {
      matchers.push(new RegExp(terms[i]));
    }

    // Check if a suggestion contains all the query terms.
    match = function (string, matchers) {
      for (var i = 0, l = matchers.length; i < l; i++) {
        if (string.match(matchers[i]) === null) {
          return false;
        }
      }
      return true;
    };

    for (i = 0, l = source.length; i < l; i++) {
      if (data.length < limit) {
        item = source[i];
        string = '';
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

})(this);