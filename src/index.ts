import VModifierCalculator from './VModifierCalculator.vue';
import type { App } from 'vue';

// Export component
export { VModifierCalculator };

// Export plugin for Vue.use()
export default {
  install(app: App) {
    app.component('VModifierCalculator', VModifierCalculator);
  }
};

// Export types
export type {
  ModifierSource,
  ModifierType,
  StackingMode,
  ModifierBreakdown
} from './types';
