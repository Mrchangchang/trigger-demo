<script>
import { alignElement, alignPoint } from 'dom-align'
import { isWindow, buffer, isSamePoint, isSimilarValue, restoreFocus } from './util';
import addDOMEventListener from 'add-dom-event-listener'
import { cloneElement } from './vnode'
import clonedeep from 'lodash/cloneDeep'

function getElement (func) {
  if (typeof func !== 'function' || !func) return null;
  return func();
}

function getPoint (point) {
  if (typeof point !== 'object' || !point) return null;
  return point;
}
export default {
  props: {
    childrenProps: {
      type: Object
    },
    align: {
      type: Object,
      required: true
    },
    target: {
      type: [Function, Object],
      default: () => window
    },
    monitorBufferTime: {
      type: Number,
      default: 50
    },
    monitorWindowResize: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data () {
    this.aligned = false;
    return {}
  },
  mounted () {
    this.$nextTick(() => {
      this.prevProps = { ...this.$props }
      const props = this.$props
      !this.aligned && this.forceAlign()
      if (!props.disabled && props.monitorWindowResize) {
        this.startMonitorWindowResize()
      }
    })
  },
  updated () {
    this.$nextTick(() => {
      const prevProps = this.prevProps
      const props = this.$props
      let reAlign = false
      if (!props.disabled) {
        const source = this.$el
        const sourceRect = source ? source.getBoundingClientRect() : null

        if (prevProps.disabled) {
          reAlign = true
        } else {
          const lastElement = getElement(prevProps.target)
          const currentElement = getElement(props.target)
          const lastPoint = getPoint(prevProps.target)
          const currentPoint = getPoint(props.target)

          if (isWindow(lastElement) && isWindow(currentElement)) {
            reAlign = false
          } else if (
            lastElement !== currentElement || // element 改变
            (lastElement && !currentElement && currentPoint) || // emement 改变为 point
            (currentPoint && isSamePoint(lastPoint, currentPoint))
          ) {
            reAlign = true
          }
          // 如果源元素大小改变
          const preRect = this.sourceRect || {}
          if (
            !reAlign &&
            source &&
            (!isSimilarValue(preRect.width, sourceRect.width) ||
              !isSimilarValue(preRect.height, sourceRect.height))
          ) {
            reAlign = true
          }
          this.sourceRect = sourceRect
        }

        if (reAlign) {
          this.forceAlign()
        }

        if (!props.disabled && props.monitorWindowResize) {
          this.startMonitorWindowResize()
        } else {
          this.stopMonitorWindowResize()
        }
        this.prevProps = {...this.$props, align: clonedeep(this.$props.align)}
      }
    })
  },
  beforeDestroy () {
    this.stopMonitorWindowResize()
  },
  methods: {
    // 绑定resize事件
    startMonitorWindowResize () {
      if (!this.resizeHandler) {
        this.bufferMonitor = buffer(this.forceAlign, this.$props.monitorBufferTime)
        this.resizeHandler = addDOMEventListener(window, 'resize', this.bufferMonitor)
      }
    },
    // 移除resize事件
    stopMonitorWindowResize () {
      if (this.resizeHandler) {
        this.bufferMonitor.clear()
        this.resizeHandler.remove()
      }
    },
    forceAlign () {
      const { disabled, target, align } = this.$props

      if (!disabled && target) {
        const source = this.$el

        let result
        const element = getElement(target)
        const point = getPoint(target)
        // 元素重新对齐后，IE失去了焦点。我们应该记录activeElement并在以后还原
        const activeElement = document.activeElement

        if (element) {
          result = alignElement(source, element, align)
        } else {
          result = alignPoint(source, point, align)
        }
        restoreFocus(activeElement, source)
        this.aligned = true
        this.$listeners.align && this.$listeners.align(source, result)
      }
    }
  },
  render () {
    const getSlot = (self, name = 'default', options = {}) => {
      return (
        (self.$scopedSlots && self.$scopedSlots[name] && self.$scopedSlots[name](options)) ||
        self.$slots[name] ||
        []
      );
    }
    const { childrenProps } = this.$props
    const child = getSlot(this)[0]
    console.log(child)
    if (childrenProps && child) {
      return cloneElement(child, childrenProps)
    } else {
      return child
    }
  }
}
</script>