import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'ECard',
  setup (props, { slots }) {
    return h('div', {
      ...props,
      class: ['e-card'],
    }, [slots.default!()])
  },
})
