///<reference path="../typings/tsd.d.ts" />
'use strict';

interface Window {
    clipboardData?: any;
}

const enum COPY_METHOD {
    CLIPBOARD_DATA,
    DOCUMENT_EXECCOMMAND
}

class CopyButton {
    public copy: (str: string) => void; //this will be replaced by actual implementation chosen basing on available api
    constructor() {
        this.chooseCopyMethod();
    }

    chooseCopyMethod():void {
        if (window.clipboardData && window.clipboardData.getData && window.clipboardData.setData) {
            this.copy = CopyButton.COPY_FUNCTIONS[COPY_METHOD.CLIPBOARD_DATA];
        } else if (document.execCommand && document.queryCommandSupported('copy')) {
            this.copy = CopyButton.COPY_FUNCTIONS[COPY_METHOD.DOCUMENT_EXECCOMMAND];
        }
    }

    private static COPY_FUNCTIONS: {
        [index: number]: (string) => void;
    } = {
        [COPY_METHOD.CLIPBOARD_DATA]: (str: string) => {
            window.clipboardData.setData('Text', str);
        },
        [COPY_METHOD.DOCUMENT_EXECCOMMAND]: (str: string) => {
            const span = document.createElement('span');
            span.innerHTML = str;
            document.body.appendChild(span);

            const range = document.createRange();
            range.selectNode(span);
            window.getSelection().addRange(range);

            document.execCommand('copy');

            window.getSelection().removeAllRanges();
            document.body.removeChild(span);
        }
    }
}
