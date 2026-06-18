import { registerRootComponent } from 'expo';
import { I18nManager } from 'react-native';
import { suppressBenignAbortErrors } from './src/utils/suppressBenignAbortErrors';

// Force RTL at the app entry point (before any screen renders) so Hebrew
// layout direction is deterministic from the very first paint.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

suppressBenignAbortErrors();

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
