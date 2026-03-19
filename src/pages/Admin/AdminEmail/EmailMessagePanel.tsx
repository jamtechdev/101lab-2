import { Button } from "@/components/ui/button";
import { useCreateEmailMessageMutation, useGetEmailMessagesQuery, useUpdateEmailMessageMutation } from "@/rtk/slices/adminApiSlice";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { CardPanel } from "./CardPanel";

const EmailMessagePanel = ({ userId }: { userId: number }) => {
  const { data } = useGetEmailMessagesQuery(userId);
  const [createMessage] = useCreateEmailMessageMutation();
  const [updateMessage] = useUpdateEmailMessageMutation();

  return (
    <CardPanel title="Email Subject">
      <RadioGroup
        value={data?.data?.find((m: any) => m.is_active)?.id?.toString()}
        onValueChange={(id) =>
          updateMessage({ messageId: Number(id), data: { is_active: true } })
        }
      >
        {data?.data?.map((msg: any) => (
          <RadioGroupItem
            key={msg.id}
            value={String(msg.id)}
          />
        ))}
      </RadioGroup>

      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={() => {
          const subject = prompt("Subject");
          const body = prompt("Body");
          if (subject && body)
            createMessage({ typeId: userId, subject, body });
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Subject
      </Button>
    </CardPanel>
  );
};

export default EmailMessagePanel;
