import { Label } from "@/components/ui/label";

type FieldProps = {
  children: React.ReactNode;
  description?: string;
  htmlFor: string;
  label: string;
};

export function Field({ children, description, htmlFor, label }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description ? <p className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
