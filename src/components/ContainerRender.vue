<script>
import Vue from 'vue'

export default {
  props: {
    autoMount: {
      type: Boolean,
      default: true
    },
    autoDestroy: {
      type: Boolean,
      default: true
    },
    visible: {
      type: Boolean
    },
    forceRender: {
      type: Boolean,
      default: false
    },
    parent: {
      type: null
    },
    getComponent: {
      type: Function,
      required: true
    },
    getContainer: {
      type: Function,
      required: true
    },
    children: {
      type: Function
    }
  },
  mounted () {
    if (this.autoMount) {
      this.renderComponent()
    }
  },
  updated () {
    if (this.autoMount) {
      this.renderComponent()
    }
  },
  beforeDestroy () {
    if (this.autoDestroy) {
      this.removeContainer()
    }
  },
  methods: {
    removeContainer () {
      if (this.container) {
        this._component && this._component.$destroy()
        this.container.parentNode.removeChild(this.container)
        this.container = null
        this._component = null
      }
    },
    renderComponent (props = {}, ready) {
      console.log(props)
      const { visible, forceRender, getContainer, parent} = this
      const self = this
      if (visible || parent.$refs._component || forceRender) {
        let el = this.conponentEl
        if (!this.container) {
          this.container = getContainer()
          el = document.createElement('div')
          this.conponentEl = el
          this.container.appendChild(el)
        }
        if (!this._component) {
          this._component = new Vue({
            el,
            parent: self.parent,
            data: {
              comProps: props
            },
            mounted () {
              this.$nextTick(() => {
                if (ready) {
                  ready.call(self)
                }
              })
            },
            updated () {
              this.$nextTick(() => {
                if (ready) {
                  ready.call(self)
                }
              })
            },
            render () {
              return self.getComponent(this.comProps)
            }
          })
        } else {
          this._component.comProps = props
        }
      }
    }
  },
  render () {
    return this.children({
      renderComponent: this.renderComponent,
      removeContainer: this.removeContainer
    })
  }
}
</script>