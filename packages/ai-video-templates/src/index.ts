// Side-effect imports populate the registry
import './templates/key-takeaways';
import './templates/multi-dim-chart';
import './templates/subtitle-bar';

export {
  registerTemplate,
  getTemplate,
  listTemplates,
  dslRegistry,
} from './registry';

export type { TemplateDefinition, TemplateInfo, TemplateTier } from './registry';
