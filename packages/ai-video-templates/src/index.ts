// Side-effect imports populate the registry.
// Tier 1 · Narrative
import './templates/title-card';
import './templates/key-takeaways';
import './templates/section-divider';
import './templates/end-card';
// Tier 2 · Data Visualization
import './templates/stock-chart';
import './templates/earnings-dashboard';
import './templates/multi-dim-chart';
import './templates/big-number-card';
import './templates/comparison-table';
import './templates/ranking-list';
import './templates/heatmap';
// Tier 3 · News & Logic
import './templates/pip-news-quote';
import './templates/social-card';
import './templates/logic-flow';
import './templates/timeline';
// Tier 4 · Decoration
import './templates/lower-third';
import './templates/subtitle-bar';

export {
  registerTemplate,
  getTemplate,
  listTemplates,
  dslRegistry,
} from './registry';

export type { TemplateDefinition, TemplateInfo, TemplateTier } from './registry';
