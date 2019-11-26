import Vue from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import ref from 'vue-ref'

Vue.use(Antd)
Vue.use(ref, { name: 'segi-ref' })
console.log(Vue)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
