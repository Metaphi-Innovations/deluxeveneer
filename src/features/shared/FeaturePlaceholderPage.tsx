import { MasterPageShell } from "../masters/shared";
import type { ErpBreadcrumbItem } from "../../components/navigation/ErpBreadcrumbs";

interface FeaturePlaceholderPageProps {
  breadcrumbs: ErpBreadcrumbItem[];
  title: string;
}

export function FeaturePlaceholderPage({
  breadcrumbs,
  title,
}: FeaturePlaceholderPageProps) {
  return <MasterPageShell breadcrumbs={breadcrumbs} title={title} />;
}
