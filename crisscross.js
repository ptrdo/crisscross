import templater from "microdata-template";
import _ from "lodash";

/**
 * Crisscross
 * Means to Monitor Progress of Work Processing on HPC Cluster
 *
 * @author psylwester(at)idmod(dot)org
 * @version 0.1.0, 2020/03/03
 * @requires ES6, microdata-template, lodash
 *
 */

/* CONFIG */

let config = {
  name: "crisscross"
};

const collection = {

  output: {},

  prep: function (data) {

    const mockedData = true;
    
    Object.values(data).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          dateTransform(item);
        });
      }
    });
    Object.values(PRIORITY).forEach(bucket => {
      if(bucket.key in data) {} else {
        data[bucket.key] = [];
      }
    });
    return data;
  },

  merge: function(data) {
    Object.values(this.output).forEach(value => {
      if (Array.isArray(value)) {
        value.forEach(item => {
          if ("something" in item && item.something in data) {
            Object.assign(item,  data[item.something]);
          }
        });
      }
    });
  },

  update: function (data) {
    this.output = this.prep(data);
    return this.output;
  },

  append: function (data) {
    this.merge(data);
    return this.output;
  },

  reset: function () {
    this.output = {};
  },

  get latest () {
    return this.output;
  }
};

const fetchAll = function (successCallback, failureCallback)  {

  path.config = { mocked: true };

  fetch(path.base+path.endpoint.Queue, { method:"GET" })
      .then(response => response.json())
      .then(data => collection.update(data.QueueState))
      .then(response => fetch(path.base+path.endpoint.Stats, { method:"GET" }))
      .then(response => response.json())
      .then(data => collection.append(data.Stats))
      .then(update => new Promise(function(resolve) {
        successCallback();
        setTimeout(function () {
          resolve(update);
        }, 0);
      }))
      .catch(function (error) {
        failureCallback(error);
      })
      .finally(function () {
        console.log("Done!");
      });
};

/* VIEW */

const view = {

  container: null,

  set element(ele) {
    this.container = ele;
  },

  get element() {
    return this.container;
  }
};

/**
 * onClick handles view's click interactions
 * @param {Event}
 */
const onClick = function(event) {
  event.preventDefault();
  console.log("onClick", event);
};

/**
 * redraw is for view updates subsequent to render
 * @param {HTMLElement} rootElement
 */
const redraw = function (rootElement=document) {

};

/**
 * render is the initial view assembly
 * @param {HTMLElement} rootElement
 * @param {Function} callback
 */
const render = function (rootElement=document, callback) {

  let templated = false;
  let source = rootElement.querySelector("[itemscope]");

  if (!!view.element) {
    console.error(`${config.name} is already rendered!`, view.element);
  } else if (!!source) {
    if (templated) {
      templater.render(source, config);
    }
    view.element = rootElement.querySelector("[itemid=crisscross]");
    view.element.addEventListener("click", onClick);
    setTimeout(function () {
      if (!!callback && callback instanceof Function) {
        callback(view.element);
      }
    }, 0);
  } else {
    console.error(`${config.name} failed to render!`, collection.latest);
    if (!!callback && callback instanceof Function) {
      callback(null);
    }
  }
};


/**
 * destroy removes view and resets caches
 */
const destroy = function () {
  /* TODO: formally remove event handlers */
  element.parentNode.removeChild(element);
  collection.reset();
};

const getData = function () {
  return collection.latest;
};

const configure = function (options) {
  Object.assign(config, (options || {}));
  return this;
};


export default { draw, configure, getData, destroy };