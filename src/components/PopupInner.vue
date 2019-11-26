<!--
 * @Author: Mr Chang
 * @Date: 2019-11-23 15:45:22
 * @LastEditors: Please set LastEditors
 * @Description: file content
 -->
<script>
import LazyRenderBox from './LazyRenderBox'

export default {
  props: {
    hiddenClassName: {
      type: String,
      default: ''
    },
    prefixCls: {
      type: String
    },
    visible: {
      type: Boolean
    }
  },
  render () {
    const {hiddenClassName, prefixCls, visible} = this
    const {$listeners} = this
    return (
      <div on={$listeners} class={!visible ? hiddenClassName: ''} >
        <LazyRenderBox class={`${prefixCls}-content` } visible={visible}>
          {this.$scopedSlots.default}
        </LazyRenderBox>
      </div>
    )
  }
}
</script>