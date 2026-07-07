import { createApp } from "vue";
import App from "./App.vue";
import './global.css'
import '@vscode/codicons/dist/codicon.css';

import { preloadMonaco } from './functions/loadmonaco';

preloadMonaco();
createApp(App).mount("#app");
