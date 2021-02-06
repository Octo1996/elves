
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'EButton',
  setup (props, { slots }) {
    return h('div', {
      ...props,
      class: ['e-button'],
    }, [slots.default!()])
  },
})
