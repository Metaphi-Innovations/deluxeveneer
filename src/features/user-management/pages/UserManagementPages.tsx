import {
  UserManagementFormPage,
  UserManagementListing,
  UserManagementViewPage,
} from "../shared";

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
