import { createContext as e } from "react";
import { FeatureflipClient as t } from "@featureflip/browser";
import { jsx as n } from "react/jsx-runtime";
//#region src/context.ts
var r = e(null);
//#endregion
//#region src/testing.tsx
function i({ flags: e, children: i }) {
	let a = t.forTesting(e);
	return /* @__PURE__ */ n(r.Provider, {
		value: {
			client: a,
			isReady: !0,
			isError: !1,
			error: null
		},
		children: i
	});
}
//#endregion
export { r as n, i as t };
