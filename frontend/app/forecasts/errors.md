[Violation] Avoid using document.write(). <URL>
[Violation] Avoid using document.write(). <URL>
[Violation] Avoid using document.write(). <URL>
[Violation] Avoid using document.write(). <URL>
[Violation] Avoid using document.write(). <URL>
frontend_e8a1cc27._.js:1024 Error exporting chart as PDF: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parseColorStop (gradient.ts:15:29)
    at linear-gradient.ts:23:27
    at Array.forEach (<anonymous>)
    at linearGradient (linear-gradient.ts:12:31)
    at Object.parse (image.ts:94:20)
    at background-image.ts:25:35
    at Array.map (<anonymous>)
    at Object.parse (background-image.ts:25:14)
    at parse (index.ts:299:31)
    at new CSSParsedDeclaration (index.ts:156:32)
    at new ElementContainer (element-container.ts:27:23)
    at createContainer (node-parser.ts:93:12)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
exportChartAsPDF @ frontend_e8a1cc27._.js:1024
await in exportChartAsPDF
handleExport @ ExportButton.tsx:45
onClick @ ExportButton.tsx:122
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:323
ExportButton @ ExportButton.tsx:121
react_stack_bottom_frame @ react-dom-client.development.js:23583
renderWithHooksAgain @ react-dom-client.development.js:6892
renderWithHooks @ react-dom-client.development.js:6804
updateFunctionComponent @ react-dom-client.development.js:9246
beginWork @ react-dom-client.development.js:10857
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:15726
workLoopSync @ react-dom-client.development.js:15546
renderRootSync @ react-dom-client.development.js:15526
performWorkOnRoot @ react-dom-client.development.js:14990
performSyncWorkOnRoot @ react-dom-client.development.js:16830
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16676
processRootScheduleInMicrotask @ react-dom-client.development.js:16714
(anonymous) @ react-dom-client.development.js:16849
ExportButton.tsx:70 Export error: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parseColorStop (gradient.ts:15:29)
    at linear-gradient.ts:23:27
    at Array.forEach (<anonymous>)
    at linearGradient (linear-gradient.ts:12:31)
    at Object.parse (image.ts:94:20)
    at background-image.ts:25:35
    at Array.map (<anonymous>)
    at Object.parse (background-image.ts:25:14)
    at parse (index.ts:299:31)
    at new CSSParsedDeclaration (index.ts:156:32)
    at new ElementContainer (element-container.ts:27:23)
    at createContainer (node-parser.ts:93:12)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
handleExport @ ExportButton.tsx:70
await in handleExport
onClick @ ExportButton.tsx:122
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:323
ExportButton @ ExportButton.tsx:121
react_stack_bottom_frame @ react-dom-client.development.js:23583
renderWithHooksAgain @ react-dom-client.development.js:6892
renderWithHooks @ react-dom-client.development.js:6804
updateFunctionComponent @ react-dom-client.development.js:9246
beginWork @ react-dom-client.development.js:10857
runWithFiberInDEV @ react-dom-client.development.js:871
performUnitOfWork @ react-dom-client.development.js:15726
workLoopSync @ react-dom-client.development.js:15546
renderRootSync @ react-dom-client.development.js:15526
performWorkOnRoot @ react-dom-client.development.js:14990
performSyncWorkOnRoot @ react-dom-client.development.js:16830
flushSyncWorkAcrossRoots_impl @ react-dom-client.development.js:16676
processRootScheduleInMicrotask @ react-dom-client.development.js:16714
(anonymous) @ react-dom-client.development.js:16849
turbopack-hot-reloader-common.ts:43 [Fast Refresh] rebuilding
report-hmr-latency.ts:26 [Fast Refresh] done in 290ms
chartExport.ts:168 Error exporting chart as PDF: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parse (index.ts:307:38)
    at new CSSParsedDeclaration (index.ts:224:38)
    at SVGElementContainer.ElementContainer (element-container.ts:27:23)
    at new SVGElementContainer (svg-element-container.ts:11:9)
    at createContainer (node-parser.ts:66:16)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
exportChartAsPDF @ chartExport.ts:168
await in exportChartAsPDF
handleExport @ ExportButton.tsx:45
onClick @ ExportButton.tsx:122
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
ExportButton.tsx:70 Export error: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parse (index.ts:307:38)
    at new CSSParsedDeclaration (index.ts:224:38)
    at SVGElementContainer.ElementContainer (element-container.ts:27:23)
    at new SVGElementContainer (svg-element-container.ts:11:9)
    at createContainer (node-parser.ts:66:16)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
handleExport @ ExportButton.tsx:70
await in handleExport
onClick @ ExportButton.tsx:122
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
chartExport.ts:122 Error exporting chart as PNG: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parse (index.ts:307:38)
    at new CSSParsedDeclaration (index.ts:224:38)
    at SVGElementContainer.ElementContainer (element-container.ts:27:23)
    at new SVGElementContainer (svg-element-container.ts:11:9)
    at createContainer (node-parser.ts:66:16)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
exportChartAsPNG @ chartExport.ts:122
await in exportChartAsPNG
handleExport @ ExportButton.tsx:41
onClick @ ExportButton.tsx:111
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
ExportButton.tsx:70 Export error: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parse (index.ts:307:38)
    at new CSSParsedDeclaration (index.ts:224:38)
    at SVGElementContainer.ElementContainer (element-container.ts:27:23)
    at new SVGElementContainer (svg-element-container.ts:11:9)
    at createContainer (node-parser.ts:66:16)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
handleExport @ ExportButton.tsx:70
await in handleExport
onClick @ ExportButton.tsx:111
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
chartExport.ts:168 Error exporting chart as PDF: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parse (index.ts:307:38)
    at new CSSParsedDeclaration (index.ts:224:38)
    at SVGElementContainer.ElementContainer (element-container.ts:27:23)
    at new SVGElementContainer (svg-element-container.ts:11:9)
    at createContainer (node-parser.ts:66:16)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
exportChartAsPDF @ chartExport.ts:168
await in exportChartAsPDF
handleExport @ ExportButton.tsx:45
onClick @ ExportButton.tsx:122
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
ExportButton.tsx:70 Export error: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parse (index.ts:307:38)
    at new CSSParsedDeclaration (index.ts:224:38)
    at SVGElementContainer.ElementContainer (element-container.ts:27:23)
    at new SVGElementContainer (svg-element-container.ts:11:9)
    at createContainer (node-parser.ts:66:16)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
handleExport @ ExportButton.tsx:70
await in handleExport
onClick @ ExportButton.tsx:122
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
chartExport.ts:271 Error copying chart to clipboard: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parse (index.ts:307:38)
    at new CSSParsedDeclaration (index.ts:224:38)
    at SVGElementContainer.ElementContainer (element-container.ts:27:23)
    at new SVGElementContainer (svg-element-container.ts:11:9)
    at createContainer (node-parser.ts:66:16)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
copyChartToClipboard @ chartExport.ts:271
await in copyChartToClipboard
handleExport @ ExportButton.tsx:61
onClick @ ExportButton.tsx:133
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
ExportButton.tsx:70 Export error: Error: Attempting to parse an unsupported color function "lab"
    at Object.parse (color.ts:15:23)
    at parse (index.ts:307:38)
    at new CSSParsedDeclaration (index.ts:224:38)
    at SVGElementContainer.ElementContainer (element-container.ts:27:23)
    at new SVGElementContainer (svg-element-container.ts:11:9)
    at createContainer (node-parser.ts:66:16)
    at parseNodeTree (node-parser.ts:27:35)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseNodeTree (node-parser.ts:48:25)
    at parseTree (node-parser.ts:99:5)
    at index.ts:127:22
    at step (tslib.es6.js:102:23)
    at Object.next (tslib.es6.js:83:53)
    at fulfilled (tslib.es6.js:73:58)
overrideMethod @ hook.js:608
error @ intercept-console-error.ts:44
handleExport @ ExportButton.tsx:70
await in handleExport
onClick @ ExportButton.tsx:133
executeDispatch @ react-dom-client.development.js:16970
runWithFiberInDEV @ react-dom-client.development.js:871
processDispatchQueue @ react-dom-client.development.js:17020
(anonymous) @ react-dom-client.development.js:17621
batchedUpdates$1 @ react-dom-client.development.js:3311
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17174
dispatchEvent @ react-dom-client.development.js:21357
dispatchDiscreteEvent @ react-dom-client.development.js:21325
