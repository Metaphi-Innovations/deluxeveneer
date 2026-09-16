import { FeaturePlaceholderPage } from "../../shared/FeaturePlaceholderPage";

interface MastersPageProps {
  title: string;
}

export function MastersPage({ title }: MastersPageProps) {
  return (
    <FeaturePlaceholderPage
      breadcrumbs={
        title === "Masters"
          ? [{ label: "Masters" }]
          : [{ label: "Masters", to: "/masters" }, { label: title }]
      }
      title={title}
    />
  );
}
