"use strict";

import * as jp from 'jsonpath';

/**
 * A handler function which can be registered to a jsonpath route
 * @callback RouteHandler
 * @param original
 * @param path
 */

/**
 * A class to represent a jsonpath route and the handler function registered to it.
 */
class Route {
  /**
   * Create a new Route
   * @param {string} path
   * @param {RouteHandler|Router} handler
   */
  constructor(path, handler) {
    this.path = path;
    this.handler = handler;
  }
}

/**
 * A Router keeps track of registered routes.
 */
export class Router {
  constructor() {
    this.middleware = [];
    this.routes = [];
  }

  use(path, handler) {
    switch (arguments.length) {
      case 0:
        throw new TypeError('not enough arguments; usage: use([path], handler)');
      case 1:
        if (typeof path !== 'function' && !(handler instanceof Router)) {
          throw new TypeError('one-arg form of use requires a function or a Router');
        }

        handler = path;
        path = '@';
        break;
      default:
        if (typeof path !== 'string') {
          throw new TypeError('path should be a jsonpath string');
        }

        if (typeof handler !== 'function' && !(handler instanceof Router)) {
          throw new TypeError('handler should be a function or a Router');
        }
    }

    this.middleware.push(new Route(path, handler));
  }

  /**
   * Register a handler function which the router will invoke when it is passed an object which matches path.
   * Handlers will be tested in the order they were registered and the first handler which matches will be called.
   * @param {string} path
   * @param {RouteHandler} handler
   */
  path(path, handler) {
    // todo: argument validation
    this.routes.push(new Route(path, handler));
  }

  dispatch(original, obj) {
    if (arguments.length === 0) {
      throw new TypeError();
    } else if (arguments.length === 1) {
      obj = original;
    }

    for (const middleware in this.middleware) {
      const match = jp.match(obj, middleware.path) || null;
      if (match !== null) {
        if (typeof middleware.handler === 'function') {
          // todo: support for next()
          return middleware.handler(original, match);
        } else if (middleware instanceof Router) {
          return middleware.handler.dispatch(original, match);
        }
      }
    }

    for (const route of this.routes) {
      const match = jp.match(obj, route.path) || null;
      if (match !== null) {
        return route.handler(original, match);
      }
    }
  }
}
