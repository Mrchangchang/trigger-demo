<!--
 * @Author: Mr Chang
 * @Date: 2019-11-23 16:39:04
 * @LastEditors: Mr Chang
 * @Description: file content
 -->
<script>
export default {
  props: {
    visible: {
      type: Boolean
    },
    hiddenClassName: {
      type: String
    }
  },
  render () {
    const { hiddenClassName } = this.$props
    let children = null
    if (hiddenClassName || !this.$slots.default || this.$slots.default.length > 1) {
      children = <div>{this.$slots.default}</div>;
    } else {
      children = this.$slots.default[0]
    }
      return children
  }
}
</script>