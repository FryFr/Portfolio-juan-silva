type Props = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: schema.org JSON-LD is static trusted content
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
