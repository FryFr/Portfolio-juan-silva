import type { ReactNode } from 'react';
import { assertUniqueIds, safeSourceHref } from './contracts';
import type {
  EvidencePanelProps,
  LifecycleProps,
  OperationalTimelineProps,
  PipelineProps,
  ProvenanceGraphProps,
  Stage,
  VisualizationProps,
  VoicePipelineProps,
} from './types';
import styles from './visualizations.module.css';

function Frame({ title, description, children }: VisualizationProps & { children: ReactNode }) {
  return (
    <figure className={styles.frame} aria-label={title}>
      <figcaption>
        <strong>{title}</strong>
        <p>{description}</p>
      </figcaption>
      {children}
    </figure>
  );
}

function StageContent({ stage }: { stage: Stage }) {
  return (
    <>
      <strong>{stage.label}</strong>
      <p>{stage.description}</p>
      {stage.status && (
        <span className={styles.status} data-status={stage.status.kind}>
          {stage.status.label}
        </span>
      )}
    </>
  );
}

function Arrow({ loop = false }: { loop?: boolean }) {
  return (
    <svg className={styles.arrow} viewBox="0 0 100 24" aria-hidden="true" focusable="false">
      <path d={loop ? 'M90 18 V6 H10 V18 M4 12 L10 18 L16 12' : 'M4 12 H94 M86 4 L94 12 L86 20'} />
    </svg>
  );
}

export function Pipeline(props: PipelineProps) {
  assertUniqueIds(props.stages);
  return (
    <Frame {...props}>
      {props.stages.length ? (
        <ol className={styles.pipeline}>
          {props.stages.map((stage, i) => (
            <li className={styles.card} key={stage.id}>
              <StageContent stage={stage} />
              {i < props.stages.length - 1 && <Arrow />}
            </li>
          ))}
        </ol>
      ) : (
        <p>{props.emptyLabel}</p>
      )}
    </Frame>
  );
}

export function Lifecycle(props: LifecycleProps) {
  assertUniqueIds(props.stages);
  return (
    <Frame {...props}>
      {props.stages.length ? (
        <>
          <ol className={styles.lifecycle}>
            {props.stages.map((stage, i) => (
              <li className={styles.card} key={stage.id}>
                <span className={styles.number} aria-hidden="true">
                  {i + 1}
                </span>
                <StageContent stage={stage} />
              </li>
            ))}
          </ol>
          <p className={styles.cycle}>
            <Arrow loop />
            {props.cycleLabel}
          </p>
        </>
      ) : (
        <p>{props.emptyLabel}</p>
      )}
    </Frame>
  );
}

export function OperationalTimeline(props: OperationalTimelineProps) {
  assertUniqueIds(props.events);
  return (
    <Frame {...props}>
      {props.events.length ? (
        <ol className={styles.timeline}>
          {props.events.map((event) => (
            <li className={styles.card} key={event.id}>
              <time dateTime={event.dateTime}>{event.timeLabel}</time>
              <StageContent stage={event} />
            </li>
          ))}
        </ol>
      ) : (
        <p>{props.emptyLabel}</p>
      )}
    </Frame>
  );
}

export function VoicePipeline(props: VoicePipelineProps) {
  assertUniqueIds(props.stages);
  for (const stage of props.stages) {
    if (
      stage.durationMs !== undefined &&
      (!Number.isFinite(stage.durationMs) || stage.durationMs < 0 || !stage.durationLabel)
    ) {
      throw new Error(
        `Voice stage ${stage.id} requires a finite nonnegative duration and localized durationLabel`,
      );
    }
  }
  return (
    <Frame {...props}>
      {props.stages.length ? (
        <ol className={styles.pipeline}>
          {props.stages.map((stage, i) => (
            <li className={styles.card} key={stage.id} data-channel={stage.channel}>
              <span className={styles.meta}>{stage.channelLabel}</span>
              <StageContent stage={stage} />
              {stage.durationMs !== undefined && (
                <span className={styles.meta}>{stage.durationLabel}</span>
              )}
              {i < props.stages.length - 1 && <Arrow />}
            </li>
          ))}
        </ol>
      ) : (
        <p>{props.emptyLabel}</p>
      )}
    </Frame>
  );
}

export function ProvenanceGraph(props: ProvenanceGraphProps) {
  assertUniqueIds(props.nodes);
  assertUniqueIds(props.edges);
  const positions = new Map(props.nodes.map((node, index) => [node.id, index]));
  for (const edge of props.edges) {
    if (!positions.has(edge.from) || !positions.has(edge.to))
      throw new Error(`Unknown provenance endpoint: ${edge.id}`);
  }
  const size = Math.max(240, props.nodes.length * 70);
  const point = (id: string) => {
    const angle = ((positions.get(id) ?? 0) / props.nodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: size / 2 + Math.cos(angle) * size * 0.35,
      y: size / 2 + Math.sin(angle) * size * 0.35,
    };
  };
  return (
    <Frame {...props}>
      {props.nodes.length ? (
        <>
          <svg
            className={styles.graph}
            viewBox={`0 0 ${size} ${size}`}
            aria-hidden="true"
            focusable="false"
          >
            {props.edges.map((edge) => {
              const a = point(edge.from);
              const b = point(edge.to);
              return edge.from === edge.to ? (
                <circle key={edge.id} cx={a.x + 16} cy={a.y - 16} r="20" className={styles.edge} />
              ) : (
                <path key={edge.id} className={styles.edge} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} />
              );
            })}
            {props.nodes.map((node, i) => {
              const p = point(node.id);
              return (
                <g key={node.id}>
                  <circle cx={p.x} cy={p.y} r="20" className={styles.node} />
                  <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central">
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
          <ol className={styles.nodes}>
            {props.nodes.map((node) => (
              <li key={node.id}>
                <StageContent stage={node} />
              </li>
            ))}
          </ol>
          <ul className={styles.relationships}>
            {props.edges.map((edge) => (
              <li key={edge.id}>
                {props.nodes[positions.get(edge.from) ?? 0]?.label} →{' '}
                {props.nodes[positions.get(edge.to) ?? 0]?.label}: {edge.label}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>{props.emptyLabel}</p>
      )}
    </Frame>
  );
}

export function EvidencePanel(props: EvidencePanelProps) {
  assertUniqueIds(props.items);
  return (
    <Frame {...props}>
      {props.items.length ? (
        <ul className={styles.evidence}>
          {props.items.map((item) => {
            const href = item.source && safeSourceHref(item.source.href);
            return (
              <li key={item.id}>
                <details className={styles.card}>
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: summary is the native disclosure control. */}
                  <summary
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        const details = event.currentTarget.parentElement;
                        if (details instanceof HTMLDetailsElement) details.open = !details.open;
                      }
                    }}
                  >
                    {item.title}
                  </summary>
                  <p>{item.summary}</p>
                  <p>{item.details}</p>
                  {item.source &&
                    (href ? (
                      <a href={href}>{item.source.label}</a>
                    ) : (
                      <span>{item.source.label}</span>
                    ))}
                </details>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>{props.emptyLabel}</p>
      )}
    </Frame>
  );
}
