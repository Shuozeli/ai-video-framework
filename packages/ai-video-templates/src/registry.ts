import type React from 'react';
import { z } from 'zod';
import type { TemplateRegistry } from '@ai-video/dsl';

export type TemplateTier = 'narrative' | 'data' | 'logic' | 'decoration';

export interface TemplateDefinition<P = any> {
  name: string;
  tier: TemplateTier;
  description: string;
  schema: z.ZodType<P>;
  defaults: Partial<P>;
  component: React.FC<P>;
}

export interface TemplateInfo {
  name: string;
  tier: TemplateTier;
  description: string;
  schemaJson: object;
}

const REGISTRY = new Map<string, TemplateDefinition>();

export function registerTemplate<P>(def: TemplateDefinition<P>): void {
  if (REGISTRY.has(def.name)) {
    throw new Error(`Template '${def.name}' already registered`);
  }
  REGISTRY.set(def.name, def as TemplateDefinition<any>);
}

export function getTemplate(name: string): TemplateDefinition | undefined {
  return REGISTRY.get(name);
}

export function listTemplates(): TemplateInfo[] {
  return [...REGISTRY.values()].map((t) => ({
    name: t.name,
    tier: t.tier,
    description: t.description,
    schemaJson: z.toJSONSchema(t.schema) as object,
  }));
}

// ============================================
// Adapter to @ai-video/dsl's TemplateRegistry interface
// ============================================

export const dslRegistry: TemplateRegistry = {
  has(name: string): boolean {
    return REGISTRY.has(name);
  },
  validateProps(name: string, props: unknown): unknown {
    const tpl = REGISTRY.get(name);
    if (!tpl) throw new Error(`Unknown template: ${name}`);
    const merged = { ...tpl.defaults, ...(props as object) };
    return tpl.schema.parse(merged);
  },
  list() {
    return [...REGISTRY.values()].map((t) => ({ name: t.name, tier: t.tier }));
  },
};
