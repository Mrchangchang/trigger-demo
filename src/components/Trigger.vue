<!--
 * @Author: Mr Chang
 * @Date: 2019-11-22 15:45:54
 * @LastEditors: Please set LastEditors
 * @Description: file content
 -->
<script>
import Popup from './Popup'
import ContainerRender from './ContainerRender'
import {hasProp, filterEmpty, getEvents} from './props-util'
import {contains, getAlignPopupClassName, getAlignFromPlacement, getComponentFromProp, requestAnimationTimeout, cancelAnimationTimeout} from './util'
import addDOMEventListener from 'add-dom-event-listener'
import {cloneElement} from './vnode'




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
  components: {
    ContainerRender
  },
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
    afterPopupVisibleChange: {
      type: Function,
      default: () => noop
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
      default: returnDocument
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
  beforeCreate () {
    ALL_HANDLERS.forEach(h => {
      this[`fire${h}`] = e => {
        this.fireEvent(h, e)
      }
    })
  },
  mounted () {
    this.$nextTick(() => {
      this.renderComponent(null)
      this.updatedCal()
    })
  },
  updated () {
    this.$nextTick(() => {
      this.updatedCal()
    })
  },
  beforeDestroy () {
    this.clearDelayTimer()
    this.clearOutsideHandler()
    clearTimeout(this.mouseDownTimeout)
  },
  methods: {
    __emit () {
      // 直接调用listeners，底层组件不需要vueTool记录events
      const args = [].slice.call(arguments, 0);
      const filterEvent = [];
      const eventName = args[0];
      if (args.length && this.$listeners[eventName]) {
        if (filterEvent.includes(eventName)) {
          this.$emit(eventName, ...args.slice(1));
        } else {
          this.$listeners[eventName](...args.slice(1));
        }
      }
    },
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
        this.clearOutsideHandler()
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
    },

    onDocumentClick (event) {
      if (this.$props.mask &&!this.$props.maskClosable) {
        return
      }
      const target = event.target
      const root = this.$el
      if (!contains(root, target) && !this.hasPopupMouseDown) {
        this.close()
      }
    },

    getPopupDomNode () {
      if (this._component && this._component.getPopupDomNode) {
        return this._component.getPopupDomNode()
      }
      return null
    },

    getRootDomNode () {
      return this.$el
    },

    handleGetPopupClassFromAlign (align) {
      const className = []
      const props = this.$props
      const {
        popupPlacement,
        builtinPlacements,
        prefixCls,
        alignPoint,
        getPopupClassNameFromAlign
      } = props
      if (popupPlacement && builtinPlacements) {
        className.push(getAlignPopupClassName(builtinPlacements, prefixCls, align, alignPoint))
      }
      if (getPopupClassNameFromAlign) {
        className.push(getPopupClassNameFromAlign(align))
      }
      return className.join(' ')
    },

    getPopupAlign () {
      const props = this.$props
      const {popupPlacement, popupAlign, builtinPlacements} = props
      if (popupPlacement && builtinPlacements) {
        return getAlignFromPlacement(builtinPlacements, popupPlacement, popupAlign)
      }
      return popupAlign
    },
    savePopup (node) {
      this._component = node
      this.savePopupRef(node)
    },
    getComponent () {
      const self = this
      const mouseProps = {}
      if (this.isMouseEnterToShow()) {
        mouseProps.mounseenter = self.onPopupMounseenter
      }
      if (this.isMouseLeaveToHide()) {
        mouseProps.mouseleave = self.onPopupMouseleave
      }
      mouseProps.mousedown = self.onPopupMouseDown
      mouseProps.touchstart = self.onPopupMouseDown
      const { handleGetPopupClassFromAlign, getRootDomNode, getContainer, $listeners} = this
      const {
        prefixCls,
        destroyPopupOnHide,
        popupClassName,
        action,
        popupAnimation,
        popupTransitionName,
        popupStyle,
        mask,
        maskAnimation,
        maskTransitionName,
        zIndex,
        stretch,
        alignPoint
      } = self.$props
      const {sPopupVisible, point} = self.$data
      const align = this.getPopupAlign()
      const popupProps = {
        props: {
          prefixCls,
          destroyPopupOnHide,
          visible: sPopupVisible,
          point: alignPoint && point,
          action,
          align,
          animation: popupAnimation,
          getClassNameFromAlign: handleGetPopupClassFromAlign,
          stretch,
          getRootDomNode,
          mask,
          zIndex,
          transitionName: popupTransitionName,
          maskAnimation,
          maskTransitionName,
          getContainer,
          popupClassName,
          popupStyle
        },
        on: {
          align: $listeners.popupAlign || noop,
          ...mouseProps
        },
        directives: [
          {
            name: 'segi-ref',
            value: this.savePopup
          }
        ]
      }
      return <Popup {...popupProps}>{getComponentFromProp(self, 'popup')}</Popup>
    },

    getContainer () {
      const {$props: props} = this
      const popupContainer = document.createElement('div')
      // 确保默认弹出容器永远不会导致滚动条出现
      popupContainer.style.position = 'absolute'
      popupContainer.style.top = '0'
      popupContainer.style.left = '0'
      popupContainer.style.width = '100%'
      const mountNode = props.getPopupContainer 
        ? props.getPopupContainer(this.$el) : props.getDocument().body
      mountNode.appendChild(popupContainer)
      this.popupContainer = popupContainer
      return popupContainer
    },

    setPopupVisible (sPopupVisible, event) {
      const { alignPoint } = this.$props
      this.clearDelayTimer()
      if ( this.$data.setPopupVisible !== sPopupVisible) {
        if (!hasProp(this, 'popupVisible')) {
          this.sPopupVisible = sPopupVisible
        }
        this.$listeners.popupVisibleChange && this.$listeners.popupVisibleChange(sPopupVisible)
      }
      // 始终记录点位置，因为mouseEnterDelay将延迟显示
      if (sPopupVisible && alignPoint && event) {
        this.setPoint(event)
      }
    },

    setPoint (point) {
      const {alignPoint} = this.$props
      if (!alignPoint || !point) return

      this.point = {
        pageX: point.pageX,
        pageY: point.pageY
      }
    },

    delaySetPopupVisible (visible, delayS, event) {
      const delay = delayS * 1000
      this.clearDelayTimer()
      if (delay) {
        const point = event ? {pageX: event.pageX, pageY: event.pageY} : null
        this.delayTimer = requestAnimationTimeout(() => {
          this.setPopupVisible(visible, point)
          this.clearDelayTimer()
        }, delay)
      } else {
        this.setPopupVisible(visible, event)
      }
    },
    clearDelayTimer () {
      if (this.delayTimer) {
        cancelAnimationTimeout(this.delayTimer)
        this.delayTimer = null
      }
    },
    clearOutsideHandler () {
      if (this.clickOutsideHander) {
        this.clickOutsideHander.remove()
        this.clickOutsideHander = null
      }
      if (this.contextmenuOutsideHander1) {
        this.contextmenuOutsideHander1.remove()
        this.contextmenuOutsideHander1 = null
      }
      if (this.contextmenuOutsideHander2) {
        this.contextmenuOutsideHander2.remove()
        this.contextmenuOutsideHander2 = null
      }
      if (this.touchOutsideHander) {
        this.touchOutsideHander.remove()
        this.touchOutsideHander = null
      }
    },

    createTwoChains (event) {
      let fn = () => {}
      const events = this.$listeners
      if (this.childOriginEvents[event] && events[event]) {
        return this[`fire${event}`]
      }
      fn = this.childOriginEvents[event] || events[event] || fn
      return fn
    },

    isClickToShow () {
      const {action, showAction} = this.$props
      return action.indexOf('click') !== -1 || showAction.indexOf('click') !== -1
    },

    isContextmenuToShow () {
      const {action, showAction} = this.$props
      return action.indexOf('contextmenu') !== -1 || showAction.indexOf('contextmenu') !== -1
    },

    isClickToHide () {
      const {action, hideAction} = this.$props
      return action.indexOf('click') !== -1 || hideAction.indexOf('click')
    },

    isMouseEnterToShow () {
      const {action, showAction} = this.$props
      return action.indexOf('hover') !== -1 || showAction.indexOf('hover') !== -1
    },

    isMouseLeaveToHide () {
      const {action, hideAction} = this.$props
      return action.indexOf('hover') !== -1 || hideAction.indexOf('mouveleave') !== -1
    },

    isFocusToShow () {
      const {action, showAction} = this.$props
      return action.indexOf('focus') !== -1 || showAction.indexOf('focus') !== -1
    },

    isBlurToHide () {
      const {action, hideAction} = this.$props
      return action.indexOf('focus') !== -1 || hideAction.indexOf('blur') !== -1
    },

    focusPopupAlign () {
      if (this.$data.sPopupVisible && this._component && this._component.$refs.alignInstance) {
        this._component.$refs.alignInstance.forceAlign()
      }
    },
    filterEvents (type, e) {
      if (this.childOriginEvents[type]) {
        this.childOriginEvents[type](e)
      }
      this.__emit(type, e);
    },

    close () {
      this.setPopupVisible(false)
    }
  },
  render () {
    const {sPopupVisible} = this
    const children = filterEmpty(this.$slots.default)
    const {forceRender, alignPoint} = this.$props

    if (children.length > 1) {
      console.error('Trigger $slots.default.length > 1, just support only one default')
    }
    const child = children[0]
    this.childOriginEvents = getEvents(child)
    const newChildProps = {
      props: {},
      on: {},
      key: 'trigger'
    }

    if (this.isContextmenuToShow()) {
      newChildProps.on.contextmenu = this.onContextmenu
    } else {
      newChildProps.on.contextmenu = this.createTwoChains('contextmenu')
    }

    if (this.isClickToHide () || this.isClickToShow()) {
      newChildProps.on.click = this.click
      newChildProps.on.mousedown = this.onMousedown
      newChildProps.on.touchstart = this.onTouchstart
    } else {
      newChildProps.on.click = this.createTwoChains('click')
      newChildProps.on.mousedown = this.createTwoChains('mousedown')
      newChildProps.on.touchstart = this.createTwoChains('touchstart')
    }
    if (this.isMouseEnterToShow()) {
      newChildProps.on.mouseenter = this.onMouseenter
      if (alignPoint) {
        newChildProps.on.mousemove = this.onMouseMove
      }
    } else {
      newChildProps.on.mounseenter = this.createTwoChains('mouseenter')
    }
    if (this.isMouseLeaveToHide()) {
      newChildProps.on.mouseleave = this.onMouseleave
    } else {
      newChildProps.on.mouseleave = this.createTwoChains('mouseleave')
    }

    if (this.isFocusToShow() || this.isBlurToHide()) {
      newChildProps.on.focus = this.onFocus
      newChildProps.on.blur = this.onBlur
    } else {
      newChildProps.on.focus = this.createTwoChains('focus')
      newChildProps.on.blur = e => {
        if (e && (!e.relatedTarget || !contains(e.target, e.relatedTarget))) {
          this.createTwoChains('blur')(e)
        }
      }
    }
    const trigger = cloneElement(child, newChildProps)

    return (
      <ContainerRender
        parent= {this}
        visible={sPopupVisible}
        autoMount={false}
        forceRender={forceRender}
        getComponent={this.getComponent}
        getContainer={this.getContainer}
        children={({renderComponent}) => {
          this.renderComponent = renderComponent
          return trigger
        }}
      />
    )
  }
}
</script>
