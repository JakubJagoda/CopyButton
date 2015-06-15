///<reference path="../typings/tsd.d.ts" />
'use strict';

interface Window {
    //this is a Microsoft extension, IE specific
    clipboardData?: any;
    //this is property set by copyButton addon
    $$CopyButtonUserscriptEnabled?: boolean;
}

const enum COPY_METHOD {
    USERSCRIPT,
    CLIPBOARD_DATA,
    DOCUMENT_EXECCOMMAND,
    MANUAL_CTRL_C
}

class CopyButton {
    private copyData:string;
    private clickToCopyElement:HTMLElement;
    private manualCtrlCElement:HTMLElement;
    private zeroClipboardClient:ZeroClipboard;

    private static MANUAL_CTRL_C_VISIBLE_CLASS = 'copy-button-visible';
    private static MANUAL_CTRL_C_HIDDEN_CLASS = 'copy-button-hidden';
    private static MANUAL_CTRL_C_TEXTAREA_CLASS = 'copy-button-data-to-copy';

    constructor(clickToCopyElement:HTMLElement, manualCtrlCElement?:HTMLElement) {
        this.clickToCopyElement = clickToCopyElement;
        this.manualCtrlCElement = manualCtrlCElement;

        if(this.manualCtrlCElement) {
            this.manualCtrlCElement.classList.add(CopyButton.MANUAL_CTRL_C_HIDDEN_CLASS);
            this.manualCtrlCElement.classList.remove(CopyButton.MANUAL_CTRL_C_VISIBLE_CLASS);
        }

        if (typeof ZeroClipboard !== 'undefined') {
            this.installZeroClipboard();
            this.zeroClipboardClient.on('error', () => {
                //ugly hack, but this is missing from the typings and this is the quickest hotfix
                (<any>this.zeroClipboardClient).destroy();
                this.installCustomCopyMethod();
            });
        } else {
            this.installCustomCopyMethod();
        }
    }

    private installZeroClipboard():void {
        this.zeroClipboardClient = new ZeroClipboard(this.clickToCopyElement);
        this.zeroClipboardClient.on('copy', (e) => {
            e.clipboardData.setData('text/plain', this.getDataToCopy());
        });
    }

    private installCustomCopyMethod():void {
        this.clickToCopyElement.addEventListener('click', () => {
            this.copy(this.getDataToCopy());
        });
    }

    private getDataToCopy():string {
        return this.copyData;
    }

    private copy(str:string):void {
        let chosenCopyMethod:COPY_METHOD;

        if (window.$$CopyButtonUserscriptEnabled) {
            chosenCopyMethod = COPY_METHOD.USERSCRIPT;
        } else if (window.clipboardData && window.clipboardData.setData) {
            chosenCopyMethod = COPY_METHOD.CLIPBOARD_DATA;
        } else if (document.execCommand && document.queryCommandSupported('copy')) {
            chosenCopyMethod = COPY_METHOD.DOCUMENT_EXECCOMMAND;
        } else if (this.manualCtrlCElement) {
            chosenCopyMethod = COPY_METHOD.MANUAL_CTRL_C;
        }

        this.COPY_FUNCTIONS[chosenCopyMethod](str);
    }

    public setCopyData(str:string) {
        this.copyData = str;
    }

    private COPY_FUNCTIONS:{
        [index: number]: (string) => void;
    } = {
        [COPY_METHOD.CLIPBOARD_DATA]: (str:string) => {
            window.clipboardData.setData('Text', str);
        },
        [COPY_METHOD.DOCUMENT_EXECCOMMAND]: (str:string) => {
            const span = document.createElement('span');
            span.innerHTML = str;
            document.body.appendChild(span);

            const range = document.createRange();
            range.selectNode(span);
            window.getSelection().addRange(range);

            document.execCommand('copy');

            window.getSelection().removeAllRanges();
            document.body.removeChild(span);
        },
        [COPY_METHOD.USERSCRIPT]: (str:string) => {
            //can't use location.origin as it's too much fresh API
            const locationOrigin = location.protocol + "//" + location.hostname + (location.port ? ':' + location.port : '');
            window.postMessage({
                $$CopyButtonDataToCopy: str
            }, locationOrigin);
        },
        [COPY_METHOD.MANUAL_CTRL_C]: (str:string) => {
            this.manualCtrlCElement.classList.remove(CopyButton.MANUAL_CTRL_C_HIDDEN_CLASS);
            this.manualCtrlCElement.classList.add(CopyButton.MANUAL_CTRL_C_VISIBLE_CLASS);

            const hiddenInput = document.createElement('textarea');
            if(!CopyButton.isTouchDisplay()) {
                //this doesn't guarantee that user doesn't have a physical keyboard, but it's more probable they won't have it
                //when they have a touch input device
                hiddenInput.setAttribute('style', 'width: 1px; height: 1px; padding: 0px; margin: 0px; opacity: 0;');
            }
            hiddenInput.value = str;
            hiddenInput.classList.add(CopyButton.MANUAL_CTRL_C_TEXTAREA_CLASS);
            this.manualCtrlCElement.appendChild(hiddenInput);
            hiddenInput.focus();
            hiddenInput.select();

            const handleCopyOnce = (e) => {
                if(e.target !== hiddenInput) {
                    return;
                }

                hiddenInput.parentNode.removeChild(hiddenInput);
                this.manualCtrlCElement.classList.remove(CopyButton.MANUAL_CTRL_C_VISIBLE_CLASS);
                this.manualCtrlCElement.classList.add(CopyButton.MANUAL_CTRL_C_HIDDEN_CLASS);
                document.removeEventListener('keyup', handleCopyOnce);
            };

            const hideCtrlCElement = (e) => {
                if(e.target === hiddenInput || e.target === this.manualCtrlCElement) {
                    return;
                }

                hiddenInput.parentNode.removeChild(hiddenInput);
                this.manualCtrlCElement.classList.remove(CopyButton.MANUAL_CTRL_C_VISIBLE_CLASS);
                this.manualCtrlCElement.classList.add(CopyButton.MANUAL_CTRL_C_HIDDEN_CLASS);
                document.removeEventListener('click', hideCtrlCElement);
            };

            if(!CopyButton.isTouchDisplay()) {
                //@todo is it possible that this event will be added and never removed, causing them to stack?
                document.addEventListener('keyup', handleCopyOnce);
            } else {
                setTimeout(() => {
                    document.addEventListener('click', hideCtrlCElement);
                });
            }
        }
    };

    //@todo make private, currently public for easy mocking
    static isTouchDisplay():boolean {
        return !!('ontouchstart' in window || navigator.msMaxTouchPoints);
    }
}
