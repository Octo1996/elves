import { App } from 'vue'

import * as components from './components'
import { ElvesInstaller } from './install'

export default function install (app: App, options: any = {}) {
  ElvesInstaller(app, {
    components,
    ...options,
  })
}
