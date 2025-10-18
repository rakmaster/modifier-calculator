<template>
  <div class="v-modifier-calculator" :class="{ 'compact': compact }">
    <!-- Total Display -->
    <div class="mod-total">
      <slot name="total" :total="computedTotal" :formula="computedFormula">
        <div class="total-value">
          <span class="total-number">{{ showFormula ? computedFormula : computedTotal }}</span>
          <span v-if="showFormula && computedTotal !== baseValue" class="total-numeric">({{ computedTotal }})</span>
        </div>
      </slot>
    </div>

    <!-- Breakdown -->
    <div v-if="showBreakdown" class="mod-breakdown">
      <slot name="breakdown" :modifiers="activeModifiers" :total="computedTotal">
        <div v-if="groupByType" class="breakdown-grouped">
          <div v-for="(mods, type) in modifiersByType" :key="type" class="breakdown-group">
            <div class="group-label">{{ type }}</div>
            <div v-for="(mod, index) in mods" :key="mod.id" class="mod-item" :class="getModifierClass(mod)">
              <slot name="modifier" :modifier="mod" :index="index">
                <span class="mod-label">{{ mod.label }}</span>
                <span class="mod-value">{{ formatValue(mod.value) }}</span>
                <button v-if="interactive" @click="removeModifier(mod.id)" class="mod-remove">×</button>
              </slot>
            </div>
          </div>
        </div>
        <div v-else class="breakdown-list">
          <div v-for="(mod, index) in activeModifiers" :key="mod.id" class="mod-item" :class="getModifierClass(mod)">
            <slot name="modifier" :modifier="mod" :index="index">
              <span class="mod-label">{{ mod.label }}</span>
              <span class="mod-value">{{ formatValue(mod.value) }}</span>
              <button v-if="interactive" @click="removeModifier(mod.id)" class="mod-remove">×</button>
            </slot>
          </div>
        </div>
      </slot>
    </div>

    <!-- Add Modifier (Interactive Mode) -->
    <div v-if="interactive" class="mod-add">
      <slot name="add-button">
        <button @click="showAddForm = !showAddForm" class="add-btn">
          {{ showAddForm ? '−' : '+' }} Add Modifier
        </button>
      </slot>
      
      <div v-if="showAddForm" class="add-form">
        <input v-model="newModifier.label" placeholder="Label" class="form-input" />
        <input v-model="newModifier.value" placeholder="Value" class="form-input" type="text" />
        <select v-model="newModifier.type" class="form-select">
          <option value="base">Base</option>
          <option value="training">Training</option>
          <option value="bonus">Bonus</option>
          <option value="penalty">Penalty</option>
          <option value="situational">Situational</option>
        </select>
        <label class="form-checkbox">
          <input v-model="newModifier.temporary" type="checkbox" />
          Temporary
        </label>
        <button @click="addModifier" class="form-submit">Add</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ModifierSource, ModifierType, StackingMode, ModifierBreakdown } from './types';

const props = defineProps<{
  modifiers?: ModifierSource[];
  baseValue?: number | string;
  stackingMode?: StackingMode;
  showBreakdown?: boolean;
  showFormula?: boolean;
  interactive?: boolean;
  compact?: boolean;
  groupByType?: boolean;
  highlightTemporary?: boolean;
}>();

const emit = defineEmits<{
  'update:total': [value: number];
  'update:formula': [formula: string];
  'update:breakdown': [breakdown: ModifierBreakdown];
  'modifier-added': [modifier: ModifierSource];
  'modifier-removed': [id: string];
}>();

// Local state
const showAddForm = ref(false);
const newModifier = ref({
  label: '',
  value: '',
  type: 'bonus' as ModifierType,
  temporary: false
});

// Active modifiers (filter by condition)
const activeModifiers = computed(() => {
  return (props.modifiers || []).filter(mod => {
    if (mod.condition) {
      return mod.condition();
    }
    return true;
  });
});

// Group modifiers by type
const modifiersByType = computed(() => {
  const grouped: Record<string, ModifierSource[]> = {};
  activeModifiers.value.forEach(mod => {
    if (!grouped[mod.type]) {
      grouped[mod.type] = [];
    }
    grouped[mod.type].push(mod);
  });
  return grouped;
});

// Calculate total based on stacking mode
const computedTotal = computed(() => {
  const base = typeof props.baseValue === 'number' ? props.baseValue : 0;
  
  if (props.stackingMode === 'highest') {
    // Only apply highest modifier
    const highest = activeModifiers.value.reduce((max, mod) => {
      const val = typeof mod.value === 'number' ? mod.value : 0;
      return val > max ? val : max;
    }, 0);
    return base + highest;
  }
  
  if (props.stackingMode === 'typed') {
    // Group by category, take highest from each
    const byCategory: Record<string, number> = {};
    activeModifiers.value.forEach(mod => {
      const val = typeof mod.value === 'number' ? mod.value : 0;
      const cat = mod.category || 'untyped';
      if (!byCategory[cat] || val > byCategory[cat]) {
        byCategory[cat] = val;
      }
    });
    return base + Object.values(byCategory).reduce((sum, val) => sum + val, 0);
  }
  
  // Default: all stack
  return base + activeModifiers.value.reduce((sum, mod) => {
    return sum + (typeof mod.value === 'number' ? mod.value : 0);
  }, 0);
});

// Compute dice formula
const computedFormula = computed(() => {
  const baseStr = props.baseValue?.toString() || '0';
  const numericMods = activeModifiers.value.filter(m => typeof m.value === 'number');
  const diceMods = activeModifiers.value.filter(m => typeof m.value === 'string');
  
  let formula = baseStr;
  
  // Add numeric modifiers
  const numericTotal = numericMods.reduce((sum, mod) => {
    return sum + (typeof mod.value === 'number' ? mod.value : 0);
  }, 0);
  
  if (numericTotal !== 0) {
    formula += numericTotal > 0 ? ` + ${numericTotal}` : ` - ${Math.abs(numericTotal)}`;
  }
  
  // Add dice modifiers
  diceMods.forEach(mod => {
    formula += ` + ${mod.value}`;
  });
  
  return formula;
});

// Breakdown
const breakdown = computed<ModifierBreakdown>(() => {
  const byType: Record<ModifierType, ModifierSource[]> = {
    base: [],
    training: [],
    bonus: [],
    penalty: [],
    situational: []
  };
  
  const byCategory: Record<string, ModifierSource[]> = {};
  
  activeModifiers.value.forEach(mod => {
    byType[mod.type].push(mod);
    const cat = mod.category || 'untyped';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(mod);
  });
  
  return {
    modifiers: activeModifiers.value,
    total: computedTotal.value,
    formula: computedFormula.value,
    byType,
    byCategory
  };
});

// Emit updates
watch(computedTotal, (val) => emit('update:total', val), { immediate: true });
watch(computedFormula, (val) => emit('update:formula', val), { immediate: true });
watch(breakdown, (val) => emit('update:breakdown', val), { immediate: true });

// Methods
function formatValue(value: number | string): string {
  if (typeof value === 'string') return value;
  return value >= 0 ? `+${value}` : `${value}`;
}

function getModifierClass(mod: ModifierSource): string {
  const classes = [`mod-type-${mod.type}`];
  if (props.highlightTemporary && mod.temporary) {
    classes.push('mod-temporary');
  }
  if (typeof mod.value === 'number' && mod.value < 0) {
    classes.push('mod-negative');
  }
  return classes.join(' ');
}

function addModifier() {
  if (!newModifier.value.label || !newModifier.value.value) return;
  
  const mod: ModifierSource = {
    id: Date.now().toString(),
    label: newModifier.value.label,
    value: isNaN(Number(newModifier.value.value)) ? newModifier.value.value : Number(newModifier.value.value),
    type: newModifier.value.type,
    temporary: newModifier.value.temporary
  };
  
  emit('modifier-added', mod);
  
  // Reset form
  newModifier.value = {
    label: '',
    value: '',
    type: 'bonus',
    temporary: false
  };
  showAddForm.value = false;
}

function removeModifier(id: string) {
  emit('modifier-removed', id);
}
</script>

<style scoped>
.v-modifier-calculator {
  --mod-primary-color: #667eea;
  --mod-positive-color: #48bb78;
  --mod-negative-color: #f56565;
  --mod-temporary-color: #ed8936;
  --mod-border-color: #e2e8f0;
  --mod-bg-color: #ffffff;
  --mod-text-color: #2d3748;
  --mod-breakdown-bg: #f7fafc;
  
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--mod-bg-color);
  border: 2px solid var(--mod-border-color);
  border-radius: 8px;
  padding: 16px;
  color: var(--mod-text-color);
}

.mod-total {
  text-align: center;
  margin-bottom: 16px;
}

.total-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.total-number {
  font-size: 32px;
  font-weight: bold;
  color: var(--mod-primary-color);
}

.total-numeric {
  font-size: 18px;
  color: #718096;
}

.mod-breakdown {
  background: var(--mod-breakdown-bg);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.breakdown-list,
.breakdown-grouped {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-group {
  margin-bottom: 12px;
}

.group-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #718096;
  margin-bottom: 6px;
}

.mod-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid var(--mod-primary-color);
}

.mod-item.mod-negative {
  border-left-color: var(--mod-negative-color);
}

.mod-item.mod-temporary {
  border-left-color: var(--mod-temporary-color);
  background: #fffaf0;
}

.mod-label {
  font-size: 14px;
  font-weight: 500;
}

.mod-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--mod-positive-color);
}

.mod-item.mod-negative .mod-value {
  color: var(--mod-negative-color);
}

.mod-remove {
  background: none;
  border: none;
  color: #cbd5e0;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s;
}

.mod-remove:hover {
  color: var(--mod-negative-color);
}

.mod-add {
  margin-top: 12px;
}

.add-btn {
  width: 100%;
  padding: 10px;
  background: var(--mod-primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #5568d3;
}

.add-form {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--mod-breakdown-bg);
  border-radius: 6px;
}

.form-input,
.form-select {
  padding: 8px 12px;
  border: 1px solid var(--mod-border-color);
  border-radius: 4px;
  font-size: 14px;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.form-submit {
  padding: 8px;
  background: var(--mod-positive-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.form-submit:hover {
  background: #38a169;
}

.compact {
  padding: 12px;
}

.compact .total-number {
  font-size: 24px;
}

.compact .mod-breakdown {
  padding: 8px;
}

.compact .mod-item {
  padding: 6px 10px;
  font-size: 13px;
}
</style>
