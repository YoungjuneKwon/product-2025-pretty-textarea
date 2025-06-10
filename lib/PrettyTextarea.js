const baseStyle = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  border: 'none',
  padding: '0',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  lineHeight: 'normal'
}

export class PrettyTextarea extends HTMLElement {
  static get observedAttributes() {
    return ['placeholder', 'rows', 'cols', 'value', 'highlight', 'maxlength'];
  }
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const thisStyle = getComputedStyle(this);

    const commonStyle = {
      ...baseStyle,
      fontSize: thisStyle.fontSize,
      fontFamily: thisStyle.fontFamily,
    };

    this.highlightLayer = document.createElement('div');
    Object.assign(this.highlightLayer.style, commonStyle, {
      pointerEvents: 'none',
      zIndex: '1',
      textAlign: 'left',
      overflow: 'hidden',
      overflowWrap: 'break-word',
      letterSpacing: 'normal',
    });

    this.textarea = document.createElement('textarea');
    Object.assign(this.textarea.style, commonStyle, {
      background: 'transparent',
      zIndex: '2',
      resize: 'none',
      color: 'rgba(255,0,0,0)',
      caretColor: 'black',
      outline: 'none',
    });

    this.textarea.style.fontSize = getComputedStyle(this.highlightLayer).fontSize;
    this.textarea.style.fontFamily = getComputedStyle(this.highlightLayer).fontFamily;

    shadow.appendChild(this.highlightLayer);
    shadow.appendChild(this.textarea);

    this.textarea.addEventListener('scroll', () => {
      this.highlightLayer.scrollTop = this.textarea.scrollTop;
      this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
    });

    this.textarea.addEventListener('input', () => {
    this.updateHighlight();

    this.dispatchEvent(new CustomEvent('input', {
        value: this.textarea.value,
        bubbles: true,
      }));
    });
  }
  get value() {
    return this.textarea ? this.textarea.value : '';
  }
  set value(val) {
    if (this.textarea) {
      this.textarea.value = val == null ? '' : String(val);
      this.setAttribute('value', this.textarea.value);
      this.updateHighlight();
    } else {
      this.setAttribute('value', val == null ? '' : String(val));
    }
  }
  connectedCallback() {
    this.style.display = 'block';
    this.updateAttributes();
    this.updateHighlight();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.updateAttributes();
    if (name === 'value' || name === 'highlight') {
      this.updateHighlight();
    }
  }
  updateAttributes() {
    const computedStyle = getComputedStyle(this);
    this.textarea.placeholder = this.getAttribute('placeholder') || '';
    this.textarea.rows = Number(this.getAttribute('rows')) || 4;
    this.textarea.cols = Number(this.getAttribute('cols')) || 50;
    this.textarea.value = this.getAttribute('value') || '';
    this.textarea.style.fontSize = this.highlightLayer.style.fontSize = computedStyle.fontSize;
    this.textarea.style.fontFamily = this.highlightLayer.style.fontFamily = computedStyle.fontFamily;

    const maxlength = this.getAttribute('maxlength');
    if (maxlength !== null && maxlength !== undefined) {
      this.textarea.maxLength = Number(maxlength);
    } else {
      this.textarea.removeAttribute('maxlength');
    }

    this.updateHighlight();
  }
  updateHighlight() {
    const value = this.textarea.value || '';
    const highlightAttr = this.getAttribute('highlight');
    if (!highlightAttr) {
      this.highlightLayer.innerHTML = value.replace(/\n/g, '<br>');
      return;
    }

    let html = value
    try {
      html = JSON.parse(highlightAttr).reduce((acc, {pattern, style}) => {
        if (!pattern || !style) return acc;
        const regex = new RegExp(pattern, 'g');
        return acc.replace(regex, (match) => `<span style="${style}">${match}</span>`);
      }, html);
    } catch {
      this.highlightLayer.innerHTML = value.replace(/\n/g, '<br>');
      return;
    }
    this.highlightLayer.innerHTML = html.replace(/\n/g, '<br>');
    if (this.highlightLayer.innerHTML.endsWith('<br>')) {
      this.highlightLayer.innerHTML += '&nbsp;';
    }

    this.highlightLayer.scrollTop = this.textarea.scrollTop;
    this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
    this.highlightLayer.style.width = `${this.textarea.clientWidth}px`;
  }
}
customElements.define('pretty-textarea', PrettyTextarea);
