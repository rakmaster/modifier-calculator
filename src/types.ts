export type ModifierType = 'base' | 'training' | 'bonus' | 'penalty' | 'situational';
export type StackingMode = 'all' | 'typed' | 'highest';

export interface ModifierSource {
  id: string;
  label: string;
  value: number | string;
  type: ModifierType;
  category?: string;
  stacks?: boolean;
  temporary?: boolean;
  condition?: () => boolean;
}

export interface ModifierBreakdown {
  modifiers: ModifierSource[];
  total: number;
  formula?: string;
  byType: Record<ModifierType, ModifierSource[]>;
  byCategory: Record<string, ModifierSource[]>;
}
