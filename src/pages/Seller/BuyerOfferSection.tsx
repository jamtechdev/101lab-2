import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

const BuyerOfferSection = ({ buyerOffer }) => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  
  console.log("buyer offer",buyerOffer);
  


  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Your Offers</h3>

      {buyerOffer && buyerOffer.offerCount > 0 ? (
        <p>You have submitted {buyerOffer.offerCount} offer(s) for this product.</p>
      ) : (
        <p>You haven't submitted any offers yet.</p>
      )}

      {/* <Button onClick={handleSubmitOffer}>Submit New Offer</Button> */}

      {submitted && (
        <div className="mt-2 p-2 border-l-4 border-green-500 bg-green-50 text-green-700">
          Offer submitted successfully!
          <Button
            variant="link"
            className="ml-4 text-blue-600 underline"
            onClick={() => navigate("/dashboard/offers")}
          >
            View your offers
          </Button>
        </div>
      )}

      {buyerOffer?.offers?.length > 0 && (
        <ul className="mt-4 space-y-2">
          {buyerOffer.offers.map((offer) => (
            <li key={offer.offer_id} className="border p-2 rounded">
              <strong>Price:</strong> {offer.price} | <strong>Quantity:</strong> {offer.quantity} |{" "}
              <strong>Status:</strong> {offer.status} | <small>{new Date(offer.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default BuyerOfferSection;
