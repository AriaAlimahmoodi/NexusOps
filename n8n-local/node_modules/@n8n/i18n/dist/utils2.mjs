//#region src/utils.ts
/**
* Derive the middle key, i.e. the segment of the render key located between
* the initial key (path to parameters root) and the property to render.
*
* Used by `nodeText()` to handle nested params.
*
* Location: `n8n-nodes-base.nodes.github.nodeView.<middleKey>.placeholder`
*/
function deriveMiddleKey(path, parameter) {
	let middleKey = parameter.name;
	if (isTopLevelCollection(path, parameter) || isNestedInCollectionLike(path)) middleKey = insertOptionsAndValues(normalize(path).split(".")).join(".");
	if (isNestedCollection(path, parameter) || isFixedCollection(path, parameter)) middleKey = insertOptionsAndValues([...normalize(path).split("."), parameter.name]).join(".");
	return middleKey;
}
/**
* Check if a param path is for a param nested inside a `collection` or
* `fixedCollection` param.
*/
const isNestedInCollectionLike = (path) => path.split(".").length >= 3;
const isTopLevelCollection = (path, parameter) => path.split(".").length === 2 && parameter.type === "collection";
const isNestedCollection = (path, parameter) => path.split(".").length > 2 && parameter.type === "collection";
/**
* Check if the param is a normal `fixedCollection`, i.e. a FC other than the wrapper
* that sits at the root of a node's top-level param and contains all of them.
*/
const isFixedCollection = (path, parameter) => parameter.type === "fixedCollection" && path !== "parameters";
/**
* Remove all indices and the `parameters.` prefix from a parameter path.
*
* Example: `parameters.a[0].b` → `a.b`
*/
const normalize = (path) => path.replace(/\[.*?\]/g, "").replace("parameters.", "");
/**
* Insert `'options'` and `'values'` on an alternating basis in a string array of
* indefinite length. Helper to create a valid render key for a collection-like param.
*
* Example: `['a', 'b', 'c']` → `['a', 'options', 'b', 'values', 'c']`
*/
const insertOptionsAndValues = (pathSegments) => {
	return pathSegments.reduce((acc, cur, i) => {
		acc.push(cur);
		if (i === pathSegments.length - 1) return acc;
		acc.push(i % 2 === 0 ? "options" : "values");
		return acc;
	}, []);
};

//#endregion
export { normalize as i, insertOptionsAndValues as n, isNestedInCollectionLike as r, deriveMiddleKey as t };
//# sourceMappingURL=utils2.mjs.map