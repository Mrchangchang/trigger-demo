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

function isPointsEq(a1, a2, isAlignPoint) {
  if (isAlignPoint) {
    return a1[0] === a2[0];
  }
  return a1[0] === a2[0] && a1[1] === a2[1];
}

export function getAlignPopupClassName(builtinPlacements, prefixCls, align, isAlignPoint) {
  const points = align.points;
  for (const placement in builtinPlacements) {
    if (builtinPlacements.hasOwnProperty(placement)) {
      if (isPointsEq(builtinPlacements[placement].points, points, isAlignPoint)) {
        return `${prefixCls}-placement-${placement}`;
      }
    }
  }
  return '';
}

export function getAlignFromPlacement(builtinPlacements, placementStr, align) {
  const baseAlign = builtinPlacements[placementStr] || {};
  return {
    ...baseAlign,
    ...align,
  };
}
export const getPropsData = ele => {
  let componentOptions = ele.componentOptions;
  if (ele.$vnode) {
    componentOptions = ele.$vnode.componentOptions;
  }
  return componentOptions ? componentOptions.propsData || {} : {};
}

export const getScopedSlots = ele => {
  return (ele.data && ele.data.scopedSlots) || {};
}

export const getComponentFromProp = (instance, prop, options = instance, execute = true) => {
  if (instance.$createElement) {
    const h = instance.$createElement;
    const temp = instance[prop];
    if (temp !== undefined) {
      return typeof temp === 'function' && execute ? temp(h, options) : temp;
    }
    return (
      (instance.$scopedSlots[prop] && execute && instance.$scopedSlots[prop](options)) ||
      instance.$scopedSlots[prop] ||
      instance.$slots[prop] ||
      undefined
    );
  } else {
    const h = instance.context.$createElement;
    const temp = getPropsData(instance)[prop];
    if (temp !== undefined) {
      return typeof temp === 'function' && execute ? temp(h, options) : temp;
    }
    const slotScope = getScopedSlots(instance)[prop];
    if (slotScope !== undefined) {
      return typeof slotScope === 'function' && execute ? slotScope(h, options) : slotScope;
    }
    const slotsProp = [];
    const componentOptions = instance.componentOptions || {};
    (componentOptions.children || []).forEach(child => {
      if (child.data && child.data.slot === prop) {
        if (child.data.attrs) {
          delete child.data.attrs.slot;
        }
        if (child.tag === 'template') {
          slotsProp.push(child.children);
        } else {
          slotsProp.push(child);
        }
      }
    });
    return slotsProp.length ? slotsProp : undefined;
  }
}
const availablePrefixs = ['moz', 'ms', 'webkit']

function requestAnimationFramePolyfill() {
  let lastTime = 0;
  return function(callback) {
    const currTime = new Date().getTime();
    const timeToCall = Math.max(0, 16 - (currTime - lastTime));
    const id = window.setTimeout(function() {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}

export default function getRequestAnimationFrame() {
  if (typeof window === 'undefined') {
    return () => {};
  }
  if (window.requestAnimationFrame) {
    // https://github.com/vuejs/vue/issues/4465
    return window.requestAnimationFrame.bind(window);
  }

  const prefix = availablePrefixs.filter(key => `${key}RequestAnimationFrame` in window)[0];

  return prefix ? window[`${prefix}RequestAnimationFrame`] : requestAnimationFramePolyfill();
}

export function cancelRequestAnimationFrame(id) {
  if (typeof window === 'undefined') {
    return null;
  }
  if (window.cancelAnimationFrame) {
    return window.cancelAnimationFrame(id);
  }
  const prefix = availablePrefixs.filter(
    key => `${key}CancelAnimationFrame` in window || `${key}CancelRequestAnimationFrame` in window,
  )[0];

  return prefix
    ? (
        window[`${prefix}CancelAnimationFrame`] || window[`${prefix}CancelRequestAnimationFrame`]
      ).call(this, id)
    : clearTimeout(id);
}

const raf = getRequestAnimationFrame()

export const cancelAnimationTimeout = frame => cancelRequestAnimationFrame(frame.id)

export const requestAnimationTimeout = (callback, delay) => {
  const start = Date.now();
  function timeout() {
    if (Date.now() - start >= delay) {
      callback.call();
    } else {
      frame.id = raf(timeout);
    }
  }

  const frame = {
    id: raf(timeout),
  };

  return frame;
}