///<reference path="../typings/tsd.d.ts" />
'use strict';

describe('Component: copyButton', () => {
    let copyButtonInstance:CopyButton;

    describe('copying data', () => {
        let originals;

        beforeEach(() => {
            originals = {
                window: {
                    clipboardData: window.clipboardData
                },
                document: {
                    queryCommandSupported: document.queryCommandSupported
                }
            };
        });

        afterEach(() => {
            window.clipboardData = originals.window.clipboardData;
            document.queryCommandSupported = originals.document.queryCommandSupported;
        });

        it('should use window.clipboardData if available', () => {
            window.clipboardData = jasmine.createSpyObj('clipboardData', ['getData', 'setData']);
            copyButtonInstance = new CopyButton();
            copyButtonInstance.copy('copied text');

            expect(window.clipboardData.setData).toHaveBeenCalledWith('Text', 'copied text');
        });

        it('should use document.execCommand if available', () => {
            spyOn(document, 'execCommand');
            document.queryCommandSupported = (command: string) => true;

            copyButtonInstance = new CopyButton();
            copyButtonInstance.copy('copied text');

            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });
    });
});
