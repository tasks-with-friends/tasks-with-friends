import type {
  Handler,
  HandlerCallback,
  HandlerContext,
  HandlerEvent,
} from '@netlify/functions';

type RouteHandler = {
  pattern: string;
  handler: Handler;
  verb: string;
};

function isRouteHandler(obj: RouteHandler | Handler): obj is RouteHandler {
  return typeof (obj as any).pattern === 'string';
}

export interface Handleable {
  handler: Handler;
}

export class NetlifyRouter<Context = any> implements Handleable {
  constructor(private readonly base: string = '', public context?: Context) {}

  private readonly routeTable: (RouteHandler | Handler)[] = [];

  get(pattern: string, handler: Handler) {
    this.routeTable.push({ pattern, handler, verb: 'get' });
  }
  use(middleware: Handler): void;
  use(pattern: string, router: NetlifyRouter): void;
  use(patternOrMiddleware: string | Handler, router?: NetlifyRouter) {
    if (typeof patternOrMiddleware === 'string' && router) {
      for (const route of router.routeTable) {
        if (isRouteHandler(route)) {
          this.routeTable.push({
            pattern: `${patternOrMiddleware}${route.pattern}`,
            handler: route.handler,
            verb: route.verb,
          });
        } else {
          this.routeTable.push(route);
        }
      }
    } else if (typeof patternOrMiddleware !== 'string') {
      this.routeTable.push(patternOrMiddleware);
    }
  }

  handler(
    event: HandlerEvent,
    context: HandlerContext,
    callback: HandlerCallback,
  ) {
    for (const route of this.routeTable) {
      if (isRouteHandler(route)) {
        if (isMatch(this.base, route, event)) {
          return route.handler(event, context, callback);
        }
      } else {
        const r = route(event, context, callback);

        if (r) return r;
      }
    }

    return { statusCode: 404 };
  }
}

function isMatch(base: string, route: RouteHandler, event: HandlerEvent) {
  return (
    route.verb === event.httpMethod.toLowerCase() &&
    normalize(`${base}${route.pattern}`) === normalize(event.path)
  );
}

function normalize(path: string) {
  let r = path;
  while (r.endsWith('/')) r = r.substring(0, r.length - 1);
  return r;
}
