<!--
 * @Author: Mr Chang
 * @Date: 2019-11-22 15:45:54
 * @LastEditors: Mr Chang
 * @Description: file content
 -->
<script>
import {hasProp} from './props-util'

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
  }
}
</script>
