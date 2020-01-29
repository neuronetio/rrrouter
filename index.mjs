import parse from "regexparam";

export default class Rrrouter {
	constructor() {
		this.routes = [];

		this.all = this.add.bind(this, "");
		this.get = this.add.bind(this, "GET");
		this.head = this.add.bind(this, "HEAD");
		this.patch = this.add.bind(this, "PATCH");
		this.options = this.add.bind(this, "OPTIONS");
		this.connect = this.add.bind(this, "CONNECT");
		this.delete = this.add.bind(this, "DELETE");
		this.trace = this.add.bind(this, "TRACE");
		this.post = this.add.bind(this, "POST");
		this.put = this.add.bind(this, "PUT");
	}

	use(path, ...fns) {
		let handlers = fns.flat();
		let { keys, pattern } = parse(path, true);
		this.routes.push({ keys, pattern, path, method: "", handlers });
		return this;
	}

	add(method, path, ...fns) {
		let { keys, pattern } = parse(path);
		this.routes.push({
			keys,
			pattern,
			path: path.toString(),
			method,
			handlers: fns.flat()
		});
		return this;
	}

	remove(method, path, handler) {
		let i = 0,
			currentRoute,
			idx,
			routes = this.routes;
		path = path.toString();
		for (const len = routes.length; i < len; i++) {
			currentRoute = routes[i];
			if (currentRoute.method !== method || currentRoute.path !== path)
				continue;
			idx = currentRoute.handlers.indexOf(handler);
			if (idx === -1) continue;
			// remove everything if this was the only handler
			// otherwise just remove the single handler
			if (currentRoute.handlers.length === 1) {
				this.routes.splice(i, 1);
			} else {
				routes[i].handlers.splice(idx, 1);
			}
		}
		return this;
	}

	find(method, url) {
		let isHEAD = method === "HEAD";
		let i = 0,
			j = 0,
			k,
			route,
			routes = this.routes;
		let matches = [],
			params = {},
			handlers = [];
		for (const len = routes.length; i < len; i++) {
			route = routes[i];
			if (
				route.method.length === 0 ||
				route.method === method ||
				(isHEAD && route.method === "GET")
			) {
				if (route.keys === false) {
					matches = route.pattern.exec(url);
					if (matches === null) continue;
					if (matches.groups !== void 0)
						for (k in matches.groups) params[k] = matches.groups[k];
					route.handlers.length > 1
						? (handlers = handlers.concat(route.handlers))
						: handlers.push(route.handlers[0]);
				} else if (route.keys.length > 0) {
					matches = route.pattern.exec(url);
					if (matches === null) continue;
					for (j = 0; j < route.keys.length; )
						params[route.keys[j]] = matches[++j];
					route.handlers.length > 1
						? (handlers = handlers.concat(route.handlers))
						: handlers.push(route.handlers[0]);
				} else if (route.pattern.test(url)) {
					route.handlers.length > 1
						? (handlers = handlers.concat(route.handlers))
						: handlers.push(route.handlers[0]);
				}
			} // else not a match
		}

		return { params, handlers };
	}
}
