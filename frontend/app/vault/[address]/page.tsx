import { VaultDashboardClient } from "@/components/VaultDashboardClient";

type VaultDashboardPageProps = {
  params: {
    address: string;
  };
};

export default function VaultDashboardPage({ params }: VaultDashboardPageProps) {
  return <VaultDashboardClient ownerAddress={params.address} />;
}
