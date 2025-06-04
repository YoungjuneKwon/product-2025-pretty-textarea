export class PrettyTextarea extends HTMLElement {
  static get observedAttributes() {
    return ['placeholder', 'rows', 'cols', 'value', 'highlight', 'maxlength'];
  }
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const thisStyle = getComputedStyle(this);

    // Highlight layer
    this.highlightLayer = document.createElement('div');
    this.highlightLayer.style = {...thisStyle}
    this.highlightLayer.style.position = 'absolute';
    this.highlightLayer.style.top = '0';
    this.highlightLayer.style.left = '0';
    this.highlightLayer.style.width = '100%';
    this.highlightLayer.style.height = '100%';
    this.highlightLayer.style.pointerEvents = 'none';
    this.highlightLayer.style.whiteSpace = 'pre-wrap';
    this.highlightLayer.style.wordBreak = 'break-word';
    this.highlightLayer.style.zIndex = '1';
    this.highlightLayer.style.textAlign = 'left';
    this.highlightLayer.style.border = 'none';
    this.highlightLayer.style.padding = '0';
    this.highlightLayer.style.lineHeight = 'normal';
    this.highlightLayer.style.overflow = 'hidden'; // Hide overflow to prevent scrollbars
    this.highlightLayer.style.overflowWrap = 'break-word';
    this.highlightLayer.style.letterSpacing = 'normal';
    // Textarea
    this.textarea = document.createElement('textarea');
    this.textarea.style = {...thisStyle}
    this.textarea.style.position = 'absolute';
    this.textarea.style.top = '0';
    this.textarea.style.left = '0';
    this.textarea.style.background = 'transparent';
    this.textarea.style.width = '100%';
    this.textarea.style.height = '100%';
    this.textarea.style.zIndex = '2';
    this.textarea.style.resize = 'none';
    this.textarea.style.color = 'rgba(255,0,0,0)'; // Semi-transparent text color
    this.textarea.style.caretColor = 'black'; // Caret color for visibility
    this.textarea.style.border = 'none';
    this.textarea.style.padding = '0';
    this.textarea.style.whiteSpace = 'pre-wrap';
    this.textarea.style.wordBreak = 'break-word';
    this.textarea.style.lineHeight = 'normal'; 
    this.textarea.style.outline = 'none'; // Remove default outline

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
    // Vue v-model 연동을 위한 이벤트
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

    // 전달받은 maxlength 속성을 textarea에 적용
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

    this.highlightLayer.scrollTop = this.textarea.scrollTop;
    this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
    this.highlightLayer.style.width = `${this.textarea.offsetWidth}px`;
  }
}
customElements.define('pretty-textarea', PrettyTextarea);
