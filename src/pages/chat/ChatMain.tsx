// @ts-nocheck
// src/App.tsx
import React from "react";
import ChatBox from "./ChatBox";

export default function App() {

  const HARD_BATCH_ID = 123; 
  const otherPartyId = 202; 

  return (
    <div style={{ padding: 24 }}>
      <h1>Chat test</h1>
      <p>Batch click opens chat box below (hardcoded testing)</p>

      <ChatBox batchId={HARD_BATCH_ID} otherPartyId={otherPartyId} />
    </div>
  );
}
