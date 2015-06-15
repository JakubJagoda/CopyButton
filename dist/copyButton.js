'use strict';
var CopyButton = (function () {
    function CopyButton(clickToCopyElement, manualCtrlCElement) {
        var _this = this;
        this.COPY_FUNCTIONS = (_a = {},
                _a[1 /* CLIPBOARD_DATA */] = function (str) {
                    window.clipboardData.setData('Text', str);
                },
                _a[2 /* DOCUMENT_EXECCOMMAND */] = function (str) {
                    var span = document.createElement('span');
                    span.innerHTML = str;
                    document.body.appendChild(span);
                    var range = document.createRange();
                    range.selectNode(span);
                    window.getSelection().addRange(range);
                    document.execCommand('copy');
                    window.getSelection().removeAllRanges();
                    document.body.removeChild(span);
                },
                _a[0 /* USERSCRIPT */] = function (str) {
                    //can't use location.origin as it's too much fresh API
                    var locationOrigin = location.protocol + "//" + location.hostname + (location.port ? ':' + location.port : '');
                    window.postMessage({
                        $$CopyButtonDataToCopy: str
                    }, locationOrigin);
                },
                _a[3 /* MANUAL_CTRL_C */] = function (str) {
                    _this.manualCtrlCElement.classList.remove(CopyButton.MANUAL_CTRL_C_HIDDEN_CLASS);
                    _this.manualCtrlCElement.classList.add(CopyButton.MANUAL_CTRL_C_VISIBLE_CLASS);
                    var hiddenInput = document.createElement('textarea');
                    if (!CopyButton.isTouchDisplay()) {
                        //this doesn't guarantee that user doesn't have a physical keyboard, but it's more probable they won't have it
                        //when they have a touch input device
                        hiddenInput.setAttribute('style', 'width: 1px; height: 1px; padding: 0px; margin: 0px; opacity: 0;');
                    }
                    hiddenInput.value = str;
                    hiddenInput.classList.add(CopyButton.MANUAL_CTRL_C_TEXTAREA_CLASS);
                    _this.manualCtrlCElement.appendChild(hiddenInput);
                    hiddenInput.focus();
                    hiddenInput.select();
                    var handleCopyOnce = function (e) {
                        if (e.target !== hiddenInput) {
                            return;
                        }
                        hiddenInput.parentNode.removeChild(hiddenInput);
                        _this.manualCtrlCElement.classList.remove(CopyButton.MANUAL_CTRL_C_VISIBLE_CLASS);
                        _this.manualCtrlCElement.classList.add(CopyButton.MANUAL_CTRL_C_HIDDEN_CLASS);
                        document.removeEventListener('keyup', handleCopyOnce);
                    };
                    var hideCtrlCElement = function (e) {
                        if (e.target === hiddenInput || e.target === _this.manualCtrlCElement) {
                            return;
                        }
                        hiddenInput.parentNode.removeChild(hiddenInput);
                        _this.manualCtrlCElement.classList.remove(CopyButton.MANUAL_CTRL_C_VISIBLE_CLASS);
                        _this.manualCtrlCElement.classList.add(CopyButton.MANUAL_CTRL_C_HIDDEN_CLASS);
                        document.removeEventListener('click', hideCtrlCElement);
                    };
                    if (!CopyButton.isTouchDisplay()) {
                        //@todo is it possible that this event will be added and never removed, causing them to stack?
                        document.addEventListener('keyup', handleCopyOnce);
                    }
                    else {
                        setTimeout(function () {
                            document.addEventListener('click', hideCtrlCElement);
                        });
                    }
                },
                _a
        );
        this.clickToCopyElement = clickToCopyElement;
        this.manualCtrlCElement = manualCtrlCElement;
        if (this.manualCtrlCElement) {
            this.manualCtrlCElement.classList.add(CopyButton.MANUAL_CTRL_C_HIDDEN_CLASS);
            this.manualCtrlCElement.classList.remove(CopyButton.MANUAL_CTRL_C_VISIBLE_CLASS);
        }
        if (typeof ZeroClipboard !== 'undefined') {
            this.installZeroClipboard();
            this.zeroClipboardClient.on('error', function () {
                //ugly hack, but this is missing from the typings and this is the quickest hotfix
                _this.zeroClipboardClient.destroy();
                _this.installCustomCopyMethod();
            });
        }
        else {
            this.installCustomCopyMethod();
        }
        var _a;
    }
    CopyButton.prototype.installZeroClipboard = function () {
        var _this = this;
        this.zeroClipboardClient = new ZeroClipboard(this.clickToCopyElement);
        this.zeroClipboardClient.on('copy', function (e) {
            e.clipboardData.setData('text/plain', _this.getDataToCopy());
        });
    };
    CopyButton.prototype.installCustomCopyMethod = function () {
        var _this = this;
        this.clickToCopyElement.addEventListener('click', function () {
            _this.copy(_this.getDataToCopy());
        });
    };
    CopyButton.prototype.getDataToCopy = function () {
        return this.copyData;
    };
    CopyButton.prototype.copy = function (str) {
        var chosenCopyMethod;
        if (window.$$CopyButtonUserscriptEnabled) {
            chosenCopyMethod = 0 /* USERSCRIPT */;
        }
        else if (window.clipboardData && window.clipboardData.setData) {
            chosenCopyMethod = 1 /* CLIPBOARD_DATA */;
        }
        else if (document.execCommand && document.queryCommandSupported('copy')) {
            chosenCopyMethod = 2 /* DOCUMENT_EXECCOMMAND */;
        }
        else if (this.manualCtrlCElement) {
            chosenCopyMethod = 3 /* MANUAL_CTRL_C */;
        }
        this.COPY_FUNCTIONS[chosenCopyMethod](str);
    };
    CopyButton.prototype.setCopyData = function (str) {
        this.copyData = str;
    };
    //@todo make private, currently public for easy mocking
    CopyButton.isTouchDisplay = function () {
        return !!('ontouchstart' in window || navigator.msMaxTouchPoints);
    };
    CopyButton.MANUAL_CTRL_C_VISIBLE_CLASS = 'copy-button-visible';
    CopyButton.MANUAL_CTRL_C_HIDDEN_CLASS = 'copy-button-hidden';
    CopyButton.MANUAL_CTRL_C_TEXTAREA_CLASS = 'copy-button-data-to-copy';
    return CopyButton;
})();
