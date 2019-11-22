<!--
 * @Author: Mr Chang
 * @Date: 2019-11-22 15:45:54
 * @LastEditors: Mr Chang
 * @Description: file content
 -->
<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <Trigger msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
import Trigger from './components/Trigger.vue'

export default {
  name: 'app',
  components: {
    Trigger
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
