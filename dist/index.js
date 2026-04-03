import { n as e, t } from "./testing-D-nDtDyw.js";
import { useCallback as n, useContext as r, useEffect as i, useRef as a, useState as o, useSyncExternalStore as s } from "react";
import { FeatureflipClient as c } from "@featureflip/browser";
import { jsx as l } from "react/jsx-runtime";
//#region src/provider.tsx
function u({ clientKey: t, context: n, baseUrl: r, streaming: s, children: u }) {
	let d = a(null), [f, p] = o(0), [m, h] = o(!1), [g, _] = o(!1), [v, y] = o(null), b = a("");
	d.current === null && (d.current = new c({
		clientKey: t,
		baseUrl: r,
		context: n,
		streaming: s
	})), i(() => {
		d.current || (d.current = new c({
			clientKey: t,
			baseUrl: r,
			context: n,
			streaming: s
		}), h(!1), _(!1), y(null), p((e) => e + 1));
		let e = d.current, i = () => h(!0), a = (e) => {
			_(!0), y(e instanceof Error ? e : Error(String(e)));
		};
		return e.on("ready", i), e.on("error", a), e.initialize().catch(a), () => {
			e.off("ready", i), e.off("error", a), e.close(), d.current = null;
		};
	}, []), i(() => {
		let e = JSON.stringify(n ?? {});
		if (b.current === "") {
			b.current = e;
			return;
		}
		e !== b.current && (b.current = e, d.current?.identify(n ?? {}).catch(() => {}));
	}, [n]);
	let x = {
		client: d.current,
		isReady: m,
		isError: g,
		error: v
	};
	return /* @__PURE__ */ l(e.Provider, {
		value: x,
		children: u
	});
}
//#endregion
//#region src/hooks.ts
function d() {
	let t = r(e);
	if (t === null) throw Error("useFeatureFlag must be used within a <FeatureflipProvider>");
	return t;
}
function f(e, t, n) {
	switch (typeof n) {
		case "boolean": return e.boolVariation(t, n);
		case "string": return e.stringVariation(t, n);
		case "number": return e.numberVariation(t, n);
		default: return e.jsonVariation(t, n);
	}
}
function p(e, t) {
	let { client: r } = d(), i = a(t);
	i.current = t;
	let o = a(void 0), c = a(void 0), l = n((e) => {
		let t = () => e();
		return r.on("change", t), () => r.off("change", t);
	}, [r]), u = n(() => {
		let t = f(r, e, i.current);
		if (Object.is(t, o.current)) return o.current;
		if (typeof t != "object" || !t) return o.current = t, t;
		try {
			let e = JSON.stringify(t);
			if (o.current !== void 0 && e === c.current) return o.current;
			o.current = t, c.current = e;
		} catch {
			o.current = t;
		}
		return t;
	}, [r, e]);
	return s(l, u, u);
}
function m() {
	let { client: e } = d();
	return e;
}
function h() {
	let { isReady: e, isError: t, error: n } = d();
	return {
		isReady: e,
		isError: t,
		error: n
	};
}
//#endregion
export { e as FeatureflipContext, u as FeatureflipProvider, t as TestFeatureflipProvider, p as useFeatureFlag, m as useFeatureflipClient, h as useFeatureflipStatus };
