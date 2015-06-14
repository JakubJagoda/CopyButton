///<reference path="../typings/tsd.d.ts" />
'use strict';

//this is a Microsoft extension, IE specific
interface Window {
    clipboardData?: any;
}

const enum COPY_METHOD {
    CLIPBOARD_DATA,
    DOCUMENT_EXECCOMMAND
}

class CopyButton {
    private copyData: string;
    private element: HTMLElement;
    private zeroClipboardClient: ZeroClipboard;

    constructor(element: HTMLElement) {
        this.element = element;
        if(typeof ZeroClipboard !== 'undefined') {
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
        this.zeroClipboardClient = new ZeroClipboard(this.element);
        this.zeroClipboardClient.on('copy', (e) => {
            e.clipboardData.setData('text/plain', this.getDataToCopy());
        });
    }

    private installCustomCopyMethod():void {
        this.element.addEventListener('click', () => {
            this.copy(this.getDataToCopy());
        });
    }

    private getDataToCopy():string {
        return this.copyData;
    }

    private copy(str: string):void {
        let chosenCopyMethod: COPY_METHOD;

        if (window.clipboardData && window.clipboardData.setData) {
            chosenCopyMethod = COPY_METHOD.CLIPBOARD_DATA;
        } else if (document.execCommand && document.queryCommandSupported('copy')) {
            chosenCopyMethod = COPY_METHOD.DOCUMENT_EXECCOMMAND;
        } else {
            //@todo add other methods
            throw new Error('No available copy API');
        }

        this.COPY_FUNCTIONS[chosenCopyMethod](str);
    }

    public setCopyData(str: string) {
        this.copyData = str;
    }

    private COPY_FUNCTIONS: {
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
