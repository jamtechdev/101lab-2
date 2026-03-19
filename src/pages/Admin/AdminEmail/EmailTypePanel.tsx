import { Button } from "@/components/ui/button";
import { useCreateEmailTypeMutation, useGetEmailTypesQuery, useUpdateEmailTypeMutation } from "@/rtk/slices/adminApiSlice";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Plus } from "lucide-react";
import { CardPanel } from "./CardPanel";

const EmailTypePanel = ({ selectedTypeId, onSelect }: { selectedTypeId: number | null; onSelect: (id: number) => void }) => {
  const { data } = useGetEmailTypesQuery();
  const [createType] = useCreateEmailTypeMutation();
  const [updateType] = useUpdateEmailTypeMutation();

  return (
    <CardPanel title="Email Type">
      <RadioGroup
        value={selectedTypeId?.toString()}
        onValueChange={(id) => {
          updateType({ id: Number(id), data: { is_active: true } } as any);
          onSelect(Number(id));
        }}
      >
        {data?.data?.map((type: any) => (
          <RadioGroupItem
            key={type.id}
            value={String(type.id)}
          />
        ))}
      </RadioGroup>

      <Button
        size="sm"
        variant="outline"
        className="mt-3"
        onClick={() => {
          const name = prompt("Type name");
          if (name) createType({ type_name: name } as any);
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> Add Type
      </Button>
    </CardPanel>
  );
};

export default EmailTypePanel;
