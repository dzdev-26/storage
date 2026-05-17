import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import App from './App.tsx';
import './index.css';

const initApp = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setOverlaysWebView({ overlay: true });
      await SplashScreen.hide();
      
      // Handle Keyboard for Mobile First android app seamlessly
      await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    } catch (e) {
      console.error('Capacitor init error', e);
    }
  }
};

initApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

