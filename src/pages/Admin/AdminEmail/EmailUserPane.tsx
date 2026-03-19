import { Button } from "@/components/ui/button";
import { useCreateEmailUserMutation, useGetEmailUsersQuery, useUpdateEmailUserMutation } from "@/rtk/slices/adminApiSlice";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { CardPanel } from "./CardPanel";

const EmailUserPanel = ({ typeId, selectedUserId, onSelect }: { typeId: number; selectedUserId: number | null; onSelect: (id: number) => void }) => {
  const { data } = useGetEmailUsersQuery(typeId);
  const [createUser] = useCreateEmailUserMutation();
  const [updateUser] = useUpdateEmailUserMutation();

  return (
    <CardPanel title="Recipients">
      <RadioGroup
        value={selectedUserId?.toString()}
        onValueChange={(id) => {
          updateUser({ userId: Number(id), data: { is_active: true } } as any);
          onSelect(Number(id));
        }}
      >
        {data?.data?.map((user: any) => (
          <RadioGroupItem
            key={user.id}
            value={String(user.id)}
          />
        ))}
      </RadioGroup>

      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={() => {
          const email = prompt("User email");
          if (email) createUser({ typeId, email } as any);
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> Add User
      </Button>
    </CardPanel>
  );
};

export default EmailUserPanel;
