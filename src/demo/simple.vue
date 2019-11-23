<script>
import Align from '../components/Align'

export default {
  data() {
    return {
      monitor: true,
      align: {
        points: ['tl', 'tc'],
      },
    };
  },
  methods: {
    getTarget() {
      const ref = this.$refs.container;
      if (!ref) {
        // parent ref not attached
        return document.getElementById('container');
      }
      return ref;
    },

    toggleMonitor() {
      this.setState({
        monitor: !this.$data.monitor,
      });
    },

    forceAlign() {
      this.$refs.align.forceAlign();
    },
    setState(state, callback) {
      const newState = typeof state === 'function' ? state(this.$data, this.$props) : state;
      // if (this.getDerivedStateFromProps) {
      //   Object.assign(newState, this.getDerivedStateFromProps(getOptionProps(this), { ...this.$data, ...newState }, true) || {})
      // }
      Object.assign(this.$data, newState);
      this.$nextTick(() => {
        callback && callback();
      });
    },
    __emit() {
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
    }
  },

  render() {
    return (
      <div
        style={{
          margin: '50px',
        }}
      >
        <p>
          <button onClick={this.forceAlign}>Force align</button>
          &nbsp;&nbsp;&nbsp;
          <label>
            <input type="checkbox" checked={this.monitor} onInput={this.toggleMonitor} />
            &nbsp; Monitor window resize
          </label>
        </p>
        <div
          ref="container"
          id="container"
          style={{
            width: '80%',
            height: '500px',
            border: '1px solid red',
          }}
        >
          <Align
            ref="align"
            target={this.getTarget}
            monitorWindowResize={this.$data.monitor}
            align={this.$data.align}
          >
            <div
              style={{
                position: 'absolute',
                width: '50px',
                height: '50px',
                background: 'yellow',
              }}
            >
              source
            </div>
          </Align>
        </div>
      </div>
    );
  },
};
</script>
