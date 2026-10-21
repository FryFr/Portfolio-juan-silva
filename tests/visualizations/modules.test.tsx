import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  EvidencePanel,
  Lifecycle,
  OperationalTimeline,
  Pipeline,
  ProvenanceGraph,
  VoicePipeline,
} from '@/shared/visualizations';
import { assertUniqueIds, safeSourceHref } from '@/shared/visualizations/contracts';

const common = { title: 'System', description: 'How it works', emptyLabel: 'No data' };
const stages = [
  {
    id: 'source',
    label: 'Source',
    description: 'Original input',
    status: { kind: 'complete' as const, label: 'Complete' },
  },
  { id: 'result', label: 'Result', description: 'Derived output' },
];
const firstStage = stages[0];
if (!firstStage) throw new Error('Test fixture requires a first stage');

describe('visualization contracts and server fallbacks', () => {
  it.each([
    <Pipeline key="pipeline" {...common} stages={[]} />,
    <Lifecycle key="lifecycle" {...common} stages={[]} cycleLabel="Repeat" />,
    <OperationalTimeline key="timeline" {...common} events={[]} />,
    <VoicePipeline key="voice" {...common} stages={[]} />,
    <ProvenanceGraph key="graph" {...common} nodes={[]} edges={[]} />,
    <EvidencePanel key="evidence" {...common} items={[]} />,
  ])('renders an explicit empty state without JavaScript', (component) => {
    expect(renderToStaticMarkup(component)).toContain('No data');
  });

  it('keeps stage order, descriptions and localized status in semantic HTML', () => {
    render(<Pipeline {...common} stages={stages} />);
    expect(screen.getByRole('figure', { name: 'System' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'SourceOriginal inputComplete',
      'ResultDerived output',
    ]);
    expect(screen.getByText('Complete')).toHaveAttribute('data-status', 'complete');
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('describes the lifecycle return transition', () => {
    render(<Lifecycle {...common} stages={stages} cycleLabel="Result returns to Source" />);
    expect(screen.getByText('Result returns to Source')).toBeVisible();
  });

  it('preserves caller ordering and machine-readable dates', () => {
    render(
      <OperationalTimeline
        {...common}
        events={[{ ...firstStage, dateTime: '2026-10-19T10:00:00Z', timeLabel: '10:00 UTC' }]}
      />,
    );
    expect(screen.getByText('10:00 UTC')).toHaveAttribute('datetime', '2026-10-19T10:00:00Z');
  });

  it('shows measured voice latency including zero and rejects invalid measurements', () => {
    const stage = {
      ...firstStage,
      channel: 'input' as const,
      channelLabel: 'Microphone',
      durationMs: 0,
      durationLabel: '0 ms',
    };
    render(<VoicePipeline {...common} stages={[stage]} />);
    expect(screen.getByText('0 ms')).toBeVisible();
    for (const durationMs of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        renderToStaticMarkup(<VoicePipeline {...common} stages={[{ ...stage, durationMs }]} />),
      ).toThrow(/duration/);
    }
  });

  it('preserves directed relationships, cycles and self references in text', () => {
    render(
      <ProvenanceGraph
        {...common}
        nodes={stages}
        edges={[
          { id: 'a', from: 'source', to: 'result', label: 'Produces' },
          { id: 'b', from: 'result', to: 'source', label: 'Feedback' },
          { id: 'c', from: 'source', to: 'source', label: 'Retained' },
        ]}
      />,
    );
    expect(screen.getByText('Source → Result: Produces')).toBeVisible();
    expect(screen.getByText('Result → Source: Feedback')).toBeVisible();
    expect(screen.getByText('Source → Source: Retained')).toBeVisible();
  });

  it('fails explicitly on dangling edges and duplicate or empty IDs', () => {
    expect(() => assertUniqueIds([{ id: 'a' }, { id: 'a' }])).toThrow(/duplicate/);
    expect(() => assertUniqueIds([{ id: ' ' }])).toThrow(/Invalid/);
    expect(() =>
      renderToStaticMarkup(
        <ProvenanceGraph
          {...common}
          nodes={stages}
          edges={[{ id: 'e', from: 'source', to: 'missing', label: 'Invalid' }]}
        />,
      ),
    ).toThrow(/endpoint/);
  });

  it('supports keyboard access to native evidence disclosure and source', async () => {
    const user = userEvent.setup();
    render(
      <EvidencePanel
        {...common}
        items={[
          {
            id: 'e',
            title: 'Benchmark',
            summary: 'Measured locally',
            details: 'Method and limitations',
            source: { href: 'https://example.com/report', label: 'Read report' },
          },
        ]}
      />,
    );
    await user.tab();
    expect(screen.getByText('Benchmark')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(document.querySelector('details')).toHaveAttribute('open');
    await user.tab();
    expect(screen.getByRole('link', { name: 'Read report' })).toHaveFocus();
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,test',
    '//example.com',
    '/\\example.com',
    ' javaScript:alert(1)',
  ])('rejects unsafe source %s', (href) => {
    expect(safeSourceHref(href)).toBeUndefined();
  });

  it.each([
    '/evidence/report',
    '#method',
    'https://example.com/report',
  ])('allows source %s', (href) => {
    expect(safeSourceHref(href)).toBe(href);
  });

  it('retains unsafe source labels without rendering executable links', () => {
    render(
      <EvidencePanel
        {...common}
        items={[
          {
            id: 'e',
            title: 'Source',
            summary: 'Summary',
            details: 'Details',
            source: { href: 'javascript:alert(1)', label: 'Reference' },
          },
        ]}
      />,
    );
    expect(screen.queryByRole('link', { hidden: true })).not.toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
  });
});
