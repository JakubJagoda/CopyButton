///<reference path="../typings/tsd.d.ts" />
///<reference path="./copyButton.ts" />
'use strict';

describe('Component: copyButton', () => {
    let copyButtonInstance:CopyButton;
    let element:HTMLButtonElement;

    beforeEach(() => {
        element = document.createElement('button');
    });

    it('should compile bare HTML element', () => {
        expect(() => {
            copyButtonInstance = new CopyButton(element);
        }).not.toThrow();
    });

    describe('zeroclipboard', () => {
        let handlers;
        let zeroClipboardInstanceMock;
        beforeEach(() => {
            handlers = {};
            zeroClipboardInstanceMock = {
                on: jasmine.createSpy('').and.callFake((evt, handler) => {
                    handlers[evt] = handler;
                }),
                destroy: jasmine.createSpy('')
            };

            spyOn(window, 'ZeroClipboard').and.returnValue(zeroClipboardInstanceMock);
        });

        it('should install zeroclipboard and use it as a copy handler first', () => {
            copyButtonInstance = new CopyButton(element);
            expect(ZeroClipboard).toHaveBeenCalledWith(element);
        });

        it('should call destroy if error was reported by zeroclipboard', () => {
            copyButtonInstance = new CopyButton(element);
            handlers['error']();
            expect(zeroClipboardInstanceMock.destroy).toHaveBeenCalled();
        });

        it('should install custom copy method if error was reported by zeroclipboard', () => {
            copyButtonInstance = new CopyButton(element);
            element.addEventListener = jasmine.createSpy('');
            handlers['error']();
            expect(element.addEventListener).toHaveBeenCalledWith('click', jasmine.any(Function));
        });
    });

    describe('custom copy methods (zeroclipboard unavailable)', () => {
        let _ZeroClipboard,
            _clipboardData;

        beforeEach(() => {
            _ZeroClipboard = ZeroClipboard;
            _clipboardData = window.clipboardData;
            window.$$CopyButtonUserscriptEnabled = false;

            window['ZeroClipboard'] = undefined;
        });

        afterEach(() => {
            window['ZeroClipboard'] = _ZeroClipboard;
            window.clipboardData = _clipboardData;
        });

        it('should copy text on click using userscript as first method', () => {
            window.$$CopyButtonUserscriptEnabled = true;
            const locationOrigin = location.protocol + "//" + location.hostname + (location.port ? ':' + location.port : '');
            spyOn(window, 'postMessage');
            copyButtonInstance = new CopyButton(element);
            copyButtonInstance.setCopyData('abc');
            element.click();
            expect(window.postMessage).toHaveBeenCalledWith({
                $$CopyButtonDataToCopy: 'abc'
            }, locationOrigin);
        });

        it('should copy text on click using clipboardData if userscript is not available', () => {
            window.clipboardData = jasmine.createSpyObj('', ['setData']);
            copyButtonInstance = new CopyButton(element);
            copyButtonInstance.setCopyData('abc');
            element.click();
            expect(window.clipboardData.setData).toHaveBeenCalledWith('Text', 'abc')
        });

        it('should copy text on click using document.execCommand if clipboardData is not available', () => {
            window.clipboardData = undefined;
            spyOn(document, 'queryCommandSupported').and.returnValue(true);
            spyOn(document, 'execCommand').and.returnValue(true);

            copyButtonInstance = new CopyButton(element);
            copyButtonInstance.setCopyData('abc');
            element.click();
            expect(document.execCommand).toHaveBeenCalledWith('copy');
        });

        describe('manual copy', () => {
            let manualCtrlCElement,
                _clipboardData;

            beforeEach(() => {
                _clipboardData = window.clipboardData;
                window.clipboardData = undefined;
                spyOn(document, 'queryCommandSupported').and.returnValue(false);

                manualCtrlCElement = document.createElement('div');
                document.body.appendChild(manualCtrlCElement);
            });

            afterEach(() => {
                window.clipboardData = _clipboardData;
                document.body.removeChild(manualCtrlCElement);
            });

            it('should create manual copy possibility when all above are not available', () => {
                spyOn(CopyButton, 'isTouchDisplay').and.returnValue(false);
                copyButtonInstance = new CopyButton(element, manualCtrlCElement);
                copyButtonInstance.setCopyData('abc');
                element.click();

                expect(manualCtrlCElement.classList).toContain('copy-button-visible');
                expect($(manualCtrlCElement).find('.copy-button-data-to-copy').val()).toBe('abc');
                expect($(manualCtrlCElement).find('.copy-button-data-to-copy').css('opacity')).toBe('0');
            });

            it('should not hide the textarea when the device has touch input', () => {
                spyOn(CopyButton, 'isTouchDisplay').and.returnValue(true);

                copyButtonInstance = new CopyButton(element, manualCtrlCElement);
                copyButtonInstance.setCopyData('abc');
                element.click();

                expect($(manualCtrlCElement).find('.copy-button-data-to-copy').css('opacity')).not.toBe('0');
            });
        });
    });
});
