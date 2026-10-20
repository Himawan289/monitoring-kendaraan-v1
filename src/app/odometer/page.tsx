import { PageHeader } from "@/components/ui";
import { OdometerForm } from "@/components/odometer-form";

export default function Page() {
  return (
    <>
      <PageHeader title="Input Odometer" subtitle="Catat kilometer kendaraan secara manual." />
      <OdometerForm />
    </>
  );
}
