<!--
 * @Author: Mr Chang
 * @Date: 2019-11-22 15:45:54
 * @LastEditors: Mr Chang
 * @Description: file content
 -->
<template>
  <div id="app">
    <point/>
    <simple/>
  </div>
</template>

<script>
import point from './demo/point'
import simple from './demo/simple'

export default {
  name: 'app',
  components: {
    point,
    simple
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
