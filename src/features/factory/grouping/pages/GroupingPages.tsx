import {
  FactoryForm,
  FactoryListing,
  FactoryProcessCreatePage,
  groupingDefinition,
} from "../../shared";

export function GroupingListPage() {
  return <FactoryListing definition={groupingDefinition} />;
}

export function AddGroupingPage() {
  return <FactoryProcessCreatePage definition={groupingDefinition} />;
}

export function EditGroupingPage() {
  return <FactoryForm definition={groupingDefinition} mode="edit" />;
}

export function ViewGroupingPage() {
  return <FactoryForm definition={groupingDefinition} mode="view" />;
}
