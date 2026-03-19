import React, { useState } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminSidebar } from "@/context/AdminSidebarContext";
import { cn } from "@/lib/utils";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  useGetEmailTypesQuery,
  useCreateEmailTypeMutation,
  useUpdateEmailTypeMutation,

  useGetEmailUsersQuery,
  useCreateEmailUserMutation,
  useUpdateEmailUserMutation,

  useGetEmailMessagesQuery,
  useCreateEmailMessageMutation,
  useUpdateEmailMessageMutation,
} from "@/rtk/slices/adminApiSlice";
import EmailTypePanel from "./AdminEmail/EmailTypePanel";
import EmailUserPanel from "./AdminEmail/EmailUserPane";

const AdminEmail = () => {
  const { sidebarCollapsed, setSidebarOpen } = useAdminSidebar();

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { data } = useGetEmailTypesQuery();


  return (
    <div className="min-h-screen bg-muted/20">
      <AdminSidebar activePath="/admin/email" />

      <div
        className={cn(
          "transition-all min-h-screen",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        {/* <header className="lg:hidden sticky top-0 bg-card border-b p-3 flex justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu />
          </Button>
          <span className="font-semibold">Admin Email</span>
        </header> */}

        <AdminHeader />

        <h1>Admin Email...</h1>
         

    
      </div>
    </div>
  );
};

export default AdminEmail;
