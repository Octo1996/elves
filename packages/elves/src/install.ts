import { App } from 'vue'

export function ElvesInstaller (app: App, options: any = {}) {
  const {
    components = {},
    directives = {},
    // ...preset
  } = options

  for (const key in directives) {
    const directive = directives[key]

    app.directive(key, directive)
  }

  for (const key in components) {
    const component = components[key]

    app.component(key, component)
  }
}
