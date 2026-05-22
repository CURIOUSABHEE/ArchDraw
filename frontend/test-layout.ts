import { TEMPLATES } from './data/templates/index';
import { getLayoutedElements } from './lib/layoutUtils';

console.time('layout');
const layoutedTemplates = TEMPLATES.slice(0, 5).map((template) => {
  return getLayoutedElements(template.nodes, template.edges, 'LR');
});
console.timeEnd('layout');
