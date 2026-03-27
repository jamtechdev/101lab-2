// @ts-nocheck
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SellerListingDetail from "../Seller/SellerListingDetail";
import SEOMeta from "@/components/common/SEOMeta";

const ListingDetail = () => {
  return (
    <>
      <SEOMeta
        title="Equipment Listing - GreenBidz Marketplace"
        description="View detailed equipment listing including specifications, pricing, and seller information. Connect with verified sellers on GreenBidz."
        keywords="equipment details, machinery listing, buy equipment, equipment specs, verified seller"
        type="product"
      />
      <Header />
      <SellerListingDetail hideLayout />
      <Footer />
    </>
  );
};

export default ListingDetail;
