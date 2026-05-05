import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { Layer, Pipeline } from '@ai-video/dsl';
import { getTemplate } from '@ai-video/templates';

function resolveRefs(props: Record<string, unknown>, materials: Pipeline['materials']): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (typeof v !== 'string') {
      out[k] = v;
      continue;
    }
    if (k === 'dataRef') {
      out['data'] = materials.data[v];
      out[k] = v;
    } else if (
      k === 'imageRef' || k === 'logoRef' || k === 'iconRef' || k === 'qrCodeRef' ||
      k === 'authorAvatarRef' || k === 'screenshotRef' || k === 'sourceLogoRef'
    ) {
      const stripped = k.replace(/Ref$/, '');
      out[stripped + 'Url'] = materials.images[v];
      out[k] = v;
    } else if (k === 'audioRef') {
      out['audioUrl'] = materials.audio[v];
      out[k] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

const ErrorPlaceholder: React.FC<{ message: string }> = ({ message }) => (
  <AbsoluteFill
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#400',
      color: '#fff',
      fontSize: 32,
      fontFamily: 'monospace',
      padding: 40,
      textAlign: 'center',
    }}
  >
    {message}
  </AbsoluteFill>
);

export const TemplateDispatcher: React.FC<{ layer: Layer; pipeline: Pipeline }> = ({ layer, pipeline }) => {
  const tpl = getTemplate(layer.type);
  if (!tpl) {
    return <ErrorPlaceholder message={`Unknown template: ${layer.type}`} />;
  }
  const resolved = resolveRefs(layer.props, pipeline.materials);
  const Component = tpl.component;
  try {
    return <Component {...resolved} />;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'render error';
    return <ErrorPlaceholder message={`${layer.type}: ${message}`} />;
  }
};
