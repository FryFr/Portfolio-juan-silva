/** All visible copy is supplied by the caller, allowing localized content. */
export interface VisualizationProps {
  title: string;
  description: string;
  emptyLabel: string;
}

export interface Stage {
  id: string;
  label: string;
  description: string;
  status?: { kind: 'pending' | 'active' | 'complete' | 'failed'; label: string };
}

export interface PipelineProps extends VisualizationProps {
  stages: readonly Stage[];
}

export interface LifecycleProps extends PipelineProps {
  /** Localized description of the transition from last stage back to first. */
  cycleLabel: string;
}

export interface OperationalEvent extends Stage {
  dateTime: string;
  timeLabel: string;
}

export interface OperationalTimelineProps extends VisualizationProps {
  events: readonly OperationalEvent[];
}

export interface VoiceStage extends Stage {
  channel: 'input' | 'processing' | 'output';
  channelLabel: string;
  /** Measured duration, omitted when unknown (never inferred). */
  durationMs?: number;
  durationLabel?: string;
}

export interface VoicePipelineProps extends VisualizationProps {
  stages: readonly VoiceStage[];
}

export interface ProvenanceEdge {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface ProvenanceGraphProps extends VisualizationProps {
  nodes: readonly Stage[];
  edges: readonly ProvenanceEdge[];
}

export interface EvidenceItem {
  id: string;
  title: string;
  summary: string;
  details: string;
  source?: { href: string; label: string };
}

export interface EvidencePanelProps extends VisualizationProps {
  items: readonly EvidenceItem[];
}
