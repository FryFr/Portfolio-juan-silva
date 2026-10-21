# Visualizations — FASE 3

Import components and prop types from `@/shared/visualizations`. These modules
render on the server without a client runtime or graphics library. No catalog,
MDX registry, remote fetching or GitHub synchronization is connected here.

```tsx
import { Pipeline, type Stage } from '@/shared/visualizations';

const stages: Stage[] = [
  { id: 'input', label: t('input'), description: t('inputDescription') },
  { id: 'output', label: t('output'), description: t('outputDescription') },
];

<Pipeline
  title={t('title')}
  description={t('description')}
  emptyLabel={t('empty')}
  stages={stages}
/>;
```

All copy, including status, channel, duration and date labels, belongs to the
caller (use the existing locale messages). IDs must be nonempty and unique per
collection. Invalid IDs, dangling graph edges and invalid voice durations throw
explicitly. Validate untrusted data at the ingestion boundary before rendering.
Inputs are readonly and never sorted or mutated.

| Component | Data | Behavior |
| --- | --- | --- |
| Pipeline | `stages` | Ordered stages with SVG connectors |
| Lifecycle | `stages`, `cycleLabel` | Numbered cycle with explicit return description |
| OperationalTimeline | `events` | Caller-ordered events, ISO `dateTime` and localized `timeLabel` |
| VoicePipeline | `stages` | Input/processing/output channels, optional measured latency |
| ProvenanceGraph | `nodes`, `edges` | Circular SVG overview plus numbered nodes and directed textual relationships |
| EvidencePanel | `items` | Native disclosures containing details and optional source links |

Graph numbers map to the ordered textual node list. Cycles and self references
are supported; no acyclic assumption is made. The diagram is decorative and the
complete semantic representation remains visible beneath it, including edge
labels and direction. This favors small explanatory graphs over dense datasets.
Empty datasets show the caller's explicit empty label.

Static diagrams do not add artificial tab stops. Evidence disclosures use native
Tab/Enter/Space behavior and links use normal keyboard navigation. Source URLs
accept HTTP(S), root-relative paths and fragments; rejected URLs retain their
label as plain text. All meaningful data remains in HTML without SVG, CSS or JS.

CSS follows the application's light/dark tokens, wraps long content and stacks
cards on small screens. It introduces no animation and explicitly disables
motion within the module when reduced motion is requested. There is no simulated
audio playback, fabricated latency or live status announcement.
