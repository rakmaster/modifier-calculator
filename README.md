# 🎲 ModifierCalculator

Game-agnostic modifier calculator for RPG systems. Aggregate bonuses, penalties, and situational modifiers with configurable stacking rules for any tabletop RPG.

**[📚 View Documentation](https://rakmaster.github.io/modifier-calculator/)** | **[🎮 Interactive Playground](https://rakmaster.github.io/modifier-calculator/component.html)**

## ✨ Features

- 🎯 **Game-agnostic** - Works with D&D, Pathfinder, Call of Cthulhu, FATE, and more
- 📊 **Visual breakdown** - See exactly where each modifier comes from
- 🔧 **Configurable stacking** - Support typed bonuses, highest-only, or all-stack rules
- ⚡ **Reactive** - Auto-updates when modifiers change
- 🎨 **Customizable** - CSS variables for easy theming
- 📱 **Mobile-friendly** - Responsive design
- 🔌 **Flexible output** - Numeric totals or dice notation formulas
- ⏱️ **Temporary modifiers** - Track buffs/debuffs separately

## 📦 Installation

```bash
npm install @modifier-calculator/vue
```

## 🚀 Quick Start

```vue
<script setup>
import { ref } from 'vue';
import { VModifierCalculator } from '@modifier-calculator/vue';

const modifiers = ref([
  { id: '1', label: 'Strength', value: 3, type: 'base' },
  { id: '2', label: 'Proficiency', value: 3, type: 'training' },
  { id: '3', label: 'Magic Weapon', value: 1, type: 'bonus' },
  { id: '4', label: 'Bless', value: '1d4', type: 'bonus', temporary: true }
]);
</script>

<template>
  <VModifierCalculator
    :modifiers="modifiers"
    show-breakdown
    @update:total="handleUpdate"
  />
</template>
```

## 📖 API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modifiers` | `ModifierSource[]` | `[]` | Array of modifier sources |
| `baseValue` | `Number \| String` | `0` | Starting value or dice notation |
| `stackingMode` | `String` | `'all'` | How modifiers stack: 'all', 'typed', 'highest' |
| `showBreakdown` | `Boolean` | `false` | Display detailed breakdown |
| `showFormula` | `Boolean` | `false` | Show dice notation formula |
| `interactive` | `Boolean` | `false` | Allow adding/removing modifiers |
| `compact` | `Boolean` | `false` | Compact display mode |
| `groupByType` | `Boolean` | `false` | Group modifiers by type in breakdown |
| `highlightTemporary` | `Boolean` | `true` | Visually distinguish temporary modifiers |

### ModifierSource Interface

```typescript
interface ModifierSource {
  id: string;              // Unique identifier
  label: string;           // Display name
  value: number | string;  // Numeric value or dice notation
  type: 'base' | 'training' | 'bonus' | 'penalty' | 'situational';
  category?: string;       // For typed stacking (e.g., 'enhancement', 'morale')
  stacks?: boolean;        // Override default stacking behavior
  temporary?: boolean;     // Mark as buff/debuff
  condition?: () => boolean; // Conditional application
}
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:total` | `Number` | Emitted when total changes |
| `update:formula` | `String` | Emitted when dice formula changes |
| `update:breakdown` | `Breakdown` | Emitted with detailed breakdown |
| `modifier-added` | `ModifierSource` | Emitted when modifier added (interactive mode) |
| `modifier-removed` | `String` | Emitted when modifier removed (interactive mode) |

### Slots

| Slot | Props | Description |
|------|-------|-------------|
| `total` | `{ total, formula }` | Custom total display |
| `breakdown` | `{ modifiers, total }` | Custom breakdown display |
| `modifier` | `{ modifier, index }` | Custom modifier item |
| `add-button` | - | Custom add modifier button (interactive mode) |

## 📝 Examples

### D&D 5e Attack Roll

```vue
<script setup>
const attackModifiers = [
  { id: 'str', label: 'Strength', value: 3, type: 'base' },
  { id: 'prof', label: 'Proficiency', value: 3, type: 'training' },
  { id: 'magic', label: '+1 Longsword', value: 1, type: 'bonus' },
  { id: 'bless', label: 'Bless', value: '1d4', type: 'bonus', temporary: true }
];
</script>

<template>
  <VModifierCalculator
    base-value="d20"
    :modifiers="attackModifiers"
    stacking-mode="all"
    show-formula
    show-breakdown
  />
  <!-- Output: "d20 + 7 + 1d4" -->
  <!-- Breakdown: "3 (STR) + 3 (prof) + 1 (magic) + 1d4 (bless)" -->
</template>
```

### Pathfinder 2e (Typed Bonuses)

```vue
<script setup>
const pf2eModifiers = [
  { id: 'dex', label: 'Dexterity', value: 4, type: 'base' },
  { id: 'prof', label: 'Expert', value: 6, type: 'training' },
  { id: 'item1', label: 'Striking Rune', value: 2, type: 'bonus', category: 'item' },
  { id: 'item2', label: 'Magic Armor', value: 1, type: 'bonus', category: 'item' }, // Won't stack!
  { id: 'status', label: 'Heroism', value: 1, type: 'bonus', category: 'status' }
];
</script>

<template>
  <VModifierCalculator
    :modifiers="pf2eModifiers"
    stacking-mode="typed"
    show-breakdown
    group-by-type
  />
  <!-- Only highest item bonus (2) applies -->
  <!-- Total: 4 + 6 + 2 + 1 = 13 -->
</template>
```

### Call of Cthulhu Skill Check

```vue
<script setup>
const cocModifiers = [
  { id: 'skill', label: 'Spot Hidden', value: 45, type: 'base' },
  { id: 'lighting', label: 'Poor Lighting', value: -10, type: 'penalty' },
  { id: 'rushed', label: 'Rushed', value: -5, type: 'penalty' }
];
</script>

<template>
  <VModifierCalculator
    :modifiers="cocModifiers"
    show-breakdown
  />
  <!-- Total: 30% (45 - 10 - 5) -->
  <!-- Roll d100 ≤ 30 to succeed -->
</template>
```

### World of Darkness Dice Pool

```vue
<script setup>
const wodModifiers = [
  { id: 'dex', label: 'Dexterity', value: 3, type: 'base' },
  { id: 'firearms', label: 'Firearms', value: 2, type: 'training' },
  { id: 'cover', label: 'Target in Cover', value: -1, type: 'penalty' }
];
</script>

<template>
  <VModifierCalculator
    :modifiers="wodModifiers"
    show-formula
  />
  <!-- Output: "4d10" (3 + 2 - 1) -->
</template>
```

### Interactive Mode

```vue
<template>
  <VModifierCalculator
    v-model:modifiers="modifiers"
    interactive
    show-breakdown
    @modifier-added="handleAdd"
    @modifier-removed="handleRemove"
  >
    <template #add-button>
      <button class="custom-add-btn">➕ Add Modifier</button>
    </template>
  </VModifierCalculator>
</template>
```

## 🎨 Theming

Customize appearance with CSS variables:

```css
.v-modifier-calculator {
  --mod-primary-color: #667eea;
  --mod-positive-color: #48bb78;
  --mod-negative-color: #f56565;
  --mod-temporary-color: #ed8936;
  --mod-border-color: #e2e8f0;
  --mod-bg-color: #ffffff;
  --mod-text-color: #2d3748;
  --mod-breakdown-bg: #f7fafc;
}
```

## 🎯 Use Cases

- **Attack Rolls** - Combine ability, proficiency, and equipment bonuses
- **Skill Checks** - Calculate total skill modifiers
- **Saving Throws** - Track all bonuses and penalties
- **Damage Calculation** - Sum damage bonuses with resistance/vulnerability
- **Initiative** - Calculate initiative modifiers
- **Spell DCs** - Compute spell save DCs
- **Dice Pools** - Calculate total dice for pool systems

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run demo
open demo.html

# Build library
npm run build
```

## 📄 License

MIT © Logan

## 🔗 Links

- [Demo](https://rakmaster.github.io/modifier-calculator/)
- [GitHub](https://github.com/rakmaster/modifier-calculator)
- [npm](https://www.npmjs.com/package/@modifier-calculator/vue)
