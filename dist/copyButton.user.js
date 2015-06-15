// ==UserScript==
// @name        CopyToClipboard
// @namespace   PGR2015
// @include     *
// @version     0.0.1
// @grant       GM_setClipboard
// ==/UserScript==

//copyButton will check for this property to ensure that it can use the userscript API
function exposeCopyButtonUserscript(window) {
    window.$$CopyButtonUserscriptEnabled = true;
}

window.addEventListener('message', function(event) {
    //we only want to read messagess that was directed specifically to us
    if(event.data.$$CopyButtonDataToCopy) {
        GM_setClipboard(event.data.$$CopyButtonDataToCopy);
    }
}, false);

var script = document.createElement('script');
script.textContent = '('+exposeCopyButtonUserscript.toString() + '(window))';
document.body.appendChild(script);
