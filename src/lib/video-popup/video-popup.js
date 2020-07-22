const OPEN_BUTTON_ID = 'button-open-popup';
const CLOSE_BUTTON_ID = 'button-close-popup';
const ESC_KEYCODE = 27;
const TAB_KEYCODE = 9;
const VIDEO_ID = '6Af6b_wyiwI';

class VideoPopup {
  constructor() {
    this._tabStops = null;
    this._lastFocusedElement = null;
    this._player = null;
    this._iframeApi = null;

    this._buttonOpen = document.getElementById(OPEN_BUTTON_ID);

    this._popup = this._createPopup();

    this._onOpenBound = this._onOpen.bind(this);
    this._onCloseBound = this._onClose.bind(this);
    this._onFocusBound = this._onFocus.bind(this);
    this._onPopupFocusNextBound = this._onPopupFocusNext.bind(this);
  }

  async init() {
    const { body } = document;

    body.insertBefore(this._popup, body.childNodes[0]);

    await this._initYouTubeIframeAPI();

    this._tabStops = this._getPopupTabStops();

    this._popup.addEventListener('keydown', this._onPopupFocusNextBound);
    this._buttonOpen.addEventListener('click', this._onOpenBound);

    body.addEventListener('focus', this._onFocusBound, true);
    body.addEventListener('click', this._onCloseBound);
    body.addEventListener('keyup', this._onCloseBound);
  }

  destroy() {
    const { body } = document;

    body.removeEventListener('keyup', this._onCloseBound);
    body.removeEventListener('click', this._onCloseBound);
    body.removeEventListener('focus', this._onFocusBound, true);

    this._buttonOpen.removeEventListener('click', this._onOpenBound);
    this._popup.removeEventListener('keydown', this._onPopupFocusNextBound);

    this._destroyYouTubeIframeAPI();

    body.removeChild(this._popup);
  }

  _getPopupTabStops() {
    const focusableElementsSelector = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    const focusableElements = [...this._popup.querySelectorAll(focusableElementsSelector)];

    const [firstTabStop] = focusableElements;
    const lastTabStop = focusableElements[focusableElements.length - 1];

    return { firstTabStop, lastTabStop };
  }

  _onFocus(event) {
    if (!(event.target.id === CLOSE_BUTTON_ID || event.target.id === 'player')) {
      event.preventDefault();
      this._tabStops.firstTabStop.focus();
    }
  }

  _onPopupFocusNext(event) {
    const { keyCode, shiftKey } = event;
    const { firstTabStop, lastTabStop } = this._tabStops;
    const isTabKey = keyCode === TAB_KEYCODE;

    if (isTabKey && shiftKey) {
      if (document.activeElement === firstTabStop) {
        event.preventDefault();
        lastTabStop.focus();
      }
    } else if (isTabKey) {
      if (document.activeElement === lastTabStop) {
        event.preventDefault();
        firstTabStop.focus();
      }
    }
  }

  _onOpen() {
    this._lastFocusedElement = document.activeElement;
    this._popup.classList.toggle('popup_visible', true);
    this._tabStops.firstTabStop.focus();
  }

  _onClose({ target = {}, keyCode, type }) {
    const isCloseButtonClicked = target.id === CLOSE_BUTTON_ID && type === 'click';
    const isEscKeyUp = keyCode === ESC_KEYCODE && type === 'keyup';

    if (isCloseButtonClicked || isEscKeyUp) {
      this._popup.classList.toggle('popup_visible', false);
      this._player.pauseVideo();

      this._lastFocusedElement.focus();
    }
  }

  _initYouTubeIframeAPI() {
    return new Promise((resolve) => {
      this._iframeApi = VideoPopup.createElement('script', { src: 'https://www.youtube.com/iframe_api' });
      document.body.appendChild(this._iframeApi);

      window.onYouTubeIframeAPIReady = () => {
        this._player = new YT.Player('player', {
          height: 480,
          width: 640,
          videoId: VIDEO_ID,
          events: {
            onReady: resolve,
            onStateChange: () => window.focus(),
          }
        });
      }
    });
  }

  _destroyYouTubeIframeAPI() {
    const { body } = document;

    const apiScript = document.getElementById('www-widgetapi-script');

    body.removeChild(apiScript);
    body.removeChild(this._iframeApi);

    this._player = null;

    window.onYouTubeIframeAPIReady = undefined;
    window.YT = undefined;
    window.YTConfig = undefined;
  }

  _createPopup() {
    const buttonClose = VideoPopup.createElement(
      'button',
      {
        className: 'popup__close-button',
        id: CLOSE_BUTTON_ID,
        ariaLabel: 'Close video popup',
      },
    );
    const iframe = VideoPopup.createElement('div', { id: 'player' });
    const popupContent = VideoPopup.createElement('div', { className: 'popup__content' }, [buttonClose, iframe]);
    const popup = VideoPopup.createElement('div', { className: 'popup' }, [popupContent]);

    return popup;
  }

  static createElement(name, props = {}, children = []) {
    const element = document.createElement(name);

    Object.entries(props).forEach(([key, value]) => {
      element[key] = value;
    });

    children.forEach((child) => {
      if (typeof child === 'string') {
        element.insertAdjacentText('beforeend', child);
      } else {
        element.appendChild(child);
      }
    });

    return element;
  }
}
