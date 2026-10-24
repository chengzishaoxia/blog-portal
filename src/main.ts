import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/base.css';
import './styles/theme.css';
import './styles/hexo.css';
import 'element-plus/dist/index.css'; // Element Plus 基础样式

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount('#app');
