<!--
 * @Author: Mr Chang
 * @Date: 2019-11-22 15:45:54
 * @LastEditors: Mr Chang
 * @Description: file content
 -->
<script>
import {hasProp} from './props-util'
import {contains} from './util'
import addDOMEventListener from 'add-dom-event-listener'

function returnEmptyString() {
  return '';
}

function returnDocument() {
  return window.document;
}
const ALL_HANDLERS = [
  'click',
  'mousedown',
  'touchstart',
  'mouseenter',
  'mouseleave',
  'focus',
  'blur',
  'contextmenu',
]
function noop () {}
export default {
  name: 'Trigger',
  props: {
    action: {
      type: [String, Array],
      default: () => []
    },
    showAction: {
      type: null,
      default: () => []
    },
    hideAction: {
      type: null,
      default: () => []
    },
    getPopupClassNameFromAlign: {
      type: null,
      default: () => returnEmptyString
    },
    popup: null,
    popupStyle: {
      type: Object,
      default: () => {}
    },
    prefixCls:{
      type: String,
      default: 'rc-trigger-popup'
    },
    popupClassName: {
      type: String,
      default: ''
    },
    popupPlacement: String,
    builtinPlacements: Object,
    popupTransitionName: [String, Object],
    popupAnimation: null,
    mouseEnterDelay: {
      type: Number,
      default: 0
    },
    mouseLeaveDelay: {
      type: Number,
      default: 0.1
    },
    zIndex: Number,
    focusDelay: {
      type: Number,
      default: 0
    },
    blurDelay: {
      type: Number,
      default: 0.15
    },
    getPopupContainer: Function,
    getDocument: {
      type: Function,
      default: () => returnDocument
    },
    forceRender: Boolean,
    destroyPopupOnHide: {
      type: Boolean,
      default: false
    },
    mask: {
      type: Boolean,
      default: false
    },
    maskClosable: {
      type: Boolean,
      default: true
    },
    popupAlign: {
      type: Object,
      default: () => {}
    },
    popupVisible: Boolean,
    defaultPopupVisible: {
      type: Boolean,
      default: false
    },
    maskTransitionName: [String, Object],
    maskAnimation: String,
    stretch: String,
    alignPoint: Boolean
  },
  provide() {
    return {
      vcTriggerContext: this,
    };
  },
  inject: {
    vcTriggerContext: { default: () => ({}) },
    savePopupRef: { default: () => noop },
  },
  data () {
    const props = this.$props
    let popupVisible
    if (hasProp(this, 'popupVisible')) {
      popupVisible = !!props.popupVisible
    } else {
      popupVisible = !!props.defaultPopupVisible
    }
    return {
      sPopupVisible: popupVisible,
      point: null
    }
  },
  watch: {
    popupVisible(val) {
      if (val !== undefined) {
        this.sPopupVisible = val
      }
    },
    sPopupVisible(val) {
      this.$nextTick(() => {
        this.renderComponent(null, () => {
          this.afterPopupVisibleChange(val)
        })
      })
    }
  },
  methods: {
    updatedCal () {
      const props = this.$props
      const state = this.$data

      if (state.sPopupVisible) {
        let currentDocument
        if ( !this.clickOutsideHander && (this.isClickToHide() || this.isContextmenuToShow())) {
          currentDocument = props.getDocument()
          this.clickOutsideHander = addDOMEventListener(
            currentDocument,
            'mousedown',
            this.onDocumentClick
          )
        }
        // 在手机上总是隐藏
        if (!this.touchOutsideHander) {
          currentDocument = currentDocument || props.getDocument()
          this.touchOutsideHander = addDOMEventListener(
            currentDocument,
            'touchstart',
            this.onDocumentClick
          )
        }
        // 当触发器类型包含“ onContextmenu”并且正在滚动文档时，关闭弹出窗口
        if ( !this.contextmenuOutsideHander1 && this.isContextmenuToShow()) {
          currentDocument = currentDocument || props.getDocument()
          this.contextmenuOutsideHander1 = addDOMEventListener(
            currentDocument,
            'scroll',
            this.onContextmenuClose
          )
        }
        // 当触发器类型包含“ onContextmenu”并且窗口失去焦点时，关闭弹出窗口。
        if ( !this.contextmenuOutsideHander2 && this.isContextmenuToShow() ) {
          this.contextmenuOutsideHander2 = addDOMEventListener(
            window,
            'blur',
            this.onContextmenuClose
          )
        }
      } else {
        this.clearOutsideHander()
      }
    },

    onMouseenter (e) {
      const { mouseEnterDelay } = this.$props
      this.filterEvents('mounseenter', e)
      this.delaySetPopupVisible(true, mouseEnterDelay, mouseEnterDelay ? null : e)
    },

    onMouseMove (e) {
      this.filterEvents('mousemove')
      this.setPoint(e)
    },

    onMouseleave (e) {
      this.filterEvents('mouseleave', e)
      this.delaySetPopupVisible(false, this.$props.mouseLeaveDelay)
    },
    onPopupMounseenter () {
      this.clearDelayTimer()
    },
    onPopupMouseleave (e) {
      if (
        e &&
        e.relatedTarget &&
        !e.relatedTarget.setTimeout &&
        this._component &&
        this._component.getPopupDomNode &&
        contains(this._component.getPopupDomNode, e.relatedTarget)
      ) {
        return
      }
      this.delaySetPopupVisible(false, e.relatedTarget)
    },

    onFocus (e) {
      this.filterEvents('focus', e)
      // 实例聚焦和失去焦点
      this.clearDelayTimer()
      if (this.isFocusToShow()) {
        this.focusTime = Date.now()
        this.delaySetPopupVisible(true, this.$props.focusDelay)
      }
    },

    onMousedown (e) {
      this.filterEvents('mousedown', e)
      this.preClickTime = Date.now()
    },

    onTouchstart (e) {
      this.filterEvents('touchstart', e)
      this.preClickTime = Date.now()
    },

    onBlur (e) {
      if (contains(e.target, e.relatedTarget || document.activeElement)) {
        this.filterEvents('blur', e)
        this.clearDelayTimer()
        if (this.isBlurToHide()) {
          this.delaySetPopupVisible(false, this.$props.blurDelay)
        }
      }
    },

    onContextmenu (e) {
      e.preventDefault();
      this.filterEvents('contextmenu', e)
      this.setPopupVisible(true, e)
    },

    onContextmenuClose () {
      if (this.isContextmenuToShow()) {
        this.close()
      }
    },

    onClick (event) {
      this.filterEvents('click', event)
      // 聚焦触发点击
      if(this.focusTime) {
        let preTime
        if (this.preClickTime && this.preTouchTime) {
          preTime = Math.min(this.preClickTime, this.preTouchTime)
        } else if (this.preClickTime) {
          preTime = this.preClickTime
        } else if (this.preTouchTime) {
          preTime = this.preTouchTime
        }
        if (Math.abs(preTime - this.focusTime) < 20) {
          return
        }
        this.focusTime = 0
      }
      this.preClickTime = 0
      this.preTouchTime = 0
      if (event && event.preventDefault) {
        event.preventDefault()
      }
      if (event && event.domEvent) {
        event.domEvent.preventDefault()
      }
      const nextVisible = !this.$data.sPopupVisible
      if ((this.isClickToHide() && !nextVisible) || (nextVisible && this.isClickToHide())) {
        this.setPopupVisible(nextVisible, event)
      }
    },
    
    onPopupMouseDown(...args) {
      const { vcTriggerContext = {} } = this
      this.hasPopupMouseDown = true
      clearTimeout(this.mouseDownTimeout)
      this.mouseDownTimeout = setTimeout(() => {
        this.hasPopupMouseDown = false;
      }, 0);

      if (vcTriggerContext.onPopupMouseDown) {
        vcTriggerContext.onPopupMouseDown(...args);
      }
    }
  }
}
</script>
