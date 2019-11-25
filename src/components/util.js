/*
 * @Author: Mr Chang
 * @Date: 2019-11-22 16:32:49
 * @LastEditors: Mr Chang
 * @Description: file content
 */

 //节流函数
export function buffer (fn, ms) {
  let timer 

  function clear() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function bufferFn() {
    clear();
    timer = setTimeout(fn, ms);
  }

  bufferFn.clear = clear
  return bufferFn
}

// 判断对象是否为window对象
export function isWindow(obj) {
  return obj && typeof obj === 'object' && obj.window === obj;
}

// 判断两次鼠标事件是否为同一位置
export function isSamePoint (prev, next) {
  if (prev === next) return true
  if (!prev || !next) return false

  if ('pageX' in next && 'pageY' in next) {
    return prev.pageX === next.pageX && prev.pageY === next.pageY
  }

  if ('clientX' in next && 'clientY' in next) {
    return prev.clientX === next.clientX && prev.clientY === next.clientY
  }

  return false
}

// 判断两个节点是否存在后代关系
export function contains (root, n) {
  let node = n
  while(node) {
    if (node === root) {
      return true
    }
    node = node.parentNode
  }

  return false
}

//当前dom在container中聚焦
export function restoreFocus (activeElement, container) {
  // 如果在容器中，请向后聚焦
  if (activeElement !== document.activeElement && contains(container, activeElement)) {
    activeElement.focus();
  }
}

// 判断两次鼠标事件位置相差是否小于1
export function isSimilarValue (val1, val2) {
  const int1 = Math.floor(val1)
  const int2 = Math.floor(val2)
  return Math.abs(int1 -int2) < 1
}
