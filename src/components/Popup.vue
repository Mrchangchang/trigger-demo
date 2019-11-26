<!--
 * @Author: Mr Chang
 * @Date: 2019-11-23 11:12:23
 * @LastEditors: Please set LastEditors
 * @Description: file content
 -->
<script>
import PopupInner from './PopupInner'
import LazyRenderBox from './LazyRenderBox'
import Align from './Align'

export default {
  props: {
    visible: {
      type: Boolean
    },
    getClassNameFromAlign: {
      type: Function
    },
    getRootDomNode: {
      type: Function
    },
    align: {
      type: null
    },
    destroyPopupOnHide: {
      type: Boolean
    },
    prefixCls: {
      type: String
    },
    getContainer: {
      type: Function
    },
    transitionName: {
      type: Function
    },
    animation: {
      type: null
    },
    maskAnimation: {
      type: String
    },
    maskTransitionName: {
      type: String
    },
    mask: {
      type: Boolean
    },
    zIndex: {
      type: Number
    },
    popupClassName: {
      type: null
    },
    popupStyle: {
      type: Object,
      default: () => { }
    },
    stretch: {
      type: String
    },
    point: {
      type: [Object, Boolean] ,
      validator (value) {
        return (value && typeof value === 'object' && typeof value.pageX === 'number' && typeof value.pageY === 'number' || !value)
      }
    }
  },
  components: {
    PopupInner, LazyRenderBox, Align
  },
  data () {
    return {
      stretchChecked: false,
      targetWidth: undefined,
      targetHeight: undefined
    }
  },
  mounted () { 
    this.$nextTick(() => {
      this.rootNode = this.getPopupDomNode()
      this.setStretchSize()
    })
  },
  updated () { 
    this.$nextTick(() => {
      this.setStretchSize()
    })
  },
  beforeDestroy () {
    if (this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    } else {
      this.$el.remove()
    }
  },
  methods: {
    setState (state, callback) {
      const newState = typeof state === 'function' ? state(this.$data, this.$props) : state;
      // if (this.getDerivedStateFromProps) {
      //   Object.assign(newState, this.getDerivedStateFromProps(getOptionProps(this), { ...this.$data, ...newState }, true) || {})
      // }
      Object.assign(this.$data, newState);
      this.$nextTick(() => {
        callback && callback();
      });
    },
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
    onAlign (popupDomNode, align) {
      const props = this.$props
      const currentAlignClassName = props.getClassNameFromAlign(align)
      if (this.currentAlignClassName !== currentAlignClassName) {
        this.currentAlignClassName = currentAlignClassName
        popupDomNode.className = this.getClassName(currentAlignClassName)
      }

      this.$listeners.align && this.$listeners.align(popupDomNode, align)
    },
    // 如果需要拉伸，则记录尺寸
    setStretchSize () {
      const { stretch, getRootDomNode, visible } = this.$props
      const { stretchChecked, targetHeight, targetWidth } = this.$data

      if (!stretch || !visible) {
        if (stretchChecked) {
          this.setState({ stretchChecked: false })
        }
        return
      }

      const $ele = getRootDomNode()
      if (!$ele) return

      const height = $ele.offsetHeight
      const width = $ele.offsetWidth

      if (targetHeight !== height || targetWidth !== width || !stretchChecked) {
        this.setState({
          stretchChecked: true,
          targetWidth: width,
          targetHeight: height
        })
      }
    },

    getPopupDomNode () {
      return this.$refs.popupInstance ? this.$refs.popupInstance.$el : null
    },

    getTargetElement () {
      return this.$props.getRootDomNode()
    },

    getAlignTarget () {
      const { point } = this.$props
      if (point) {
        return point
      }
      return this.getTargetElement
    },

    getMaskTransitionName () {
      const props = this.$props
      let transitionName = props.maskTransitionName
      const animation = props.maskAnimation
      if (!transitionName && animation) {
        transitionName = `${props.prefixCls}-${animation}`
      }
      return transitionName
    },

    getTransitionName () {
      const props = this.$props
      let transitionName = props.transitionName
      const animation = props.animation

      if (!transitionName) {
        if (typeof animation === 'string') {
          transitionName = `${animation}`
        } else if (animation && animation.props && animation.props.name) {
          transitionName = animation.props.name
        }
      }
      return transitionName
    },

    getClassName (currentAlignClassName) {
      return `${this.$props.prefixCls} ${this.$props.popupClassName} ${currentAlignClassName}`
    },

    getPopupElement () {
      const { $props: props, $slots, $listeners, getTransitionName } = this
      const { stretchChecked, targetHeight, targetWidth } = this.$data
      const {
        align,
        visible,
        prefixCls,
        animation,
        popupStyle,
        getClassNameFromAlign,
        destroyPopupOnHide,
        stretch,
      } = props
      const className = this.getClassName(
        this.currentAlignClassName || getClassNameFromAlign(align),
      )

      if (!visible) {
        this.currentAlignClassName = null
      }
      const sizeStyle = {}

      if (stretch) {

        if (stretch.indexOf('height') !== -1) {
          sizeStyle.height = typeof targetHeight === 'number' ? `${targetHeight}px` : targetHeight
        } else if (stretch.indexOf('minHeight') !== -1) {
          sizeStyle.height = typeof targetHeight === 'number' ? `${targetHeight}px` : targetHeight
        }

        if (stretch.indexOf('width') !== -1) {
          sizeStyle.width = typeof targetWidth === 'number' ? `${targetWidth}px` : targetWidth
        } else if (stretch.indexOf('minWidth') !== -1) {
          sizeStyle.width = typeof targetWidth === 'number' ? `${targetWidth}px` : targetWidth
        }

        if (!stretchChecked) {
          setTimeout(() => {
            if (this.$refs.alignInstance) {
              this.$refs.alignInstance.forceAlign()
            }
          }, 0)
        }
      }
      const popupInnerProps = {
        props: {
          prefixCls,
          visible
        },
        class: className,
        on: $listeners,
        ref: 'popupInstance',
        style: { ...sizeStyle, popupStyle, ...this.getZIndexStyle() }
      }

      let transitionProps = {
        props: Object.assign({
          appear: true,
          css: false
        })
      }
      const transitionName = getTransitionName()
      let useTransition = !!transitionName
      const transitionEvent = {
        beforeEnter () {
          // ...
        },
        enter (el, done) {
          if (this.$refs.alignInstance) {
            this.$refs.alignInstance.$nextTick(() => {
              animation(el, `${transitionName}-enter`, done)
            })
          }
        },
        leave (el, done) {
          animation(el, `${transitionName}-leave`, done)
        }
      }

      if (typeof animation === 'object') {
        useTransition = true
        const { on = {}, props = {} } = animation
        transitionProps.props = { ...transitionProps.props, ...props }
        transitionProps.on = { ...transitionEvent, ...on }
      } else {
        transitionProps.on = transitionEvent
      }

      if (!useTransition) {
        transitionProps = {}
      }
      if (destroyPopupOnHide) {
        return (
          <transition {...transitionProps}>
            {visible ? (
              <Align
                target={this.getAlignTarget()}
                key="popup"
                ref="alignInstance"
                monitorWindowResize
                align={align}
                onAlign={this.onAlign}
              >
                <PopupInner {...popupInnerProps}>{$slots.default}</PopupInner>
              </Align>
            ) : null}
          </transition>
        )
      }
      return (
        <transition>
          <Align
            v-show={visible}
            target={this.getAlignTarget()}
            key="popup"
            ref="alignInstance"
            monitorWindowResize
            align={align}
            onAlign={this.onAlign}
          >
            <PopupInner {...popupInnerProps}>{$slots.default}</PopupInner>
          </Align>
        </transition>
      )
    },

    getZIndexStyle() {
      const style = {}
      const props = this.$props
      if (props.zIndex !== undefined) {
        style.zIndex = props.zIndex
      }
      return style
    },

    getMaskElement () {
      const props = this.$props
      let maskElement = null
      if (props.mask) {
        const maskTransition = this.getMaskTransitionName()
        maskElement = (
          <LazyRenderBox 
            v-show={props.visible}
            style={this.getZIndexStyle()}
            key={props.mask}
            className={`${props.prefixCls}-mask`}
            visible={props.visible}
           />
        )
        if (maskTransition) {
          maskElement = (
            <transition>
              {maskElement}
            </transition>
          )
        }
      }
      return maskElement
    }
  },

  render () {
    const {getMaskElement, getPopupElement} = this
    return (
      <div>
        {getMaskElement()}
        {getPopupElement()}
      </div>
    )
  }
}
</script>