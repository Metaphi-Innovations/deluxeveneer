import { UserManagementFormPage } from "../form/UserManagementFormPage";
import { UserManagementListing } from "../listing/UserManagementListing";
import { UserManagementViewPage } from "../view/UserManagementViewPage";

export function UserManagementPage() {
  return <UserManagementListing />;
}

export function AddUserManagementPage() {
  return <UserManagementFormPage mode="add" />;
}

export function EditUserManagementPage() {
  return <UserManagementFormPage mode="edit" />;
}

export function ViewUserManagementPage() {
  return <UserManagementViewPage />;
}
