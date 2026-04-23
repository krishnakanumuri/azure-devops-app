import { AppRegistry } from 'react-native';
import App from '../App';

AppRegistry.registerComponent('AzureDevOpsApp', () => App);
AppRegistry.runApplication('AzureDevOpsApp', {
  rootTag: document.getElementById('root'),
});

if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}
