import DashboardLayout from "@/components/layouts/DashboardLayout";
import MyBids from "@/pages/buyer/MyBids";

const SellerMyBids = () => {
  return (
    <DashboardLayout>
      <MyBids batchBasePath="/dashboard/buying" />
    </DashboardLayout>
  );
};

export default SellerMyBids;
