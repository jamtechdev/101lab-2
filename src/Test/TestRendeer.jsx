import React, { useState } from "react";

const ChildRender = () => {
  console.log("child render ...");

  return (
    <div>
      <p>Child Reder ...</p>
    </div>
  );
};

const TestRendeer = () => {
  const [state, setState] = useState(true);

  return (
    <div>
      <p>TestRendeer</p>
      <button
        onClick={() => setState(!state)}
        className="px-2 py-2 border border-red-500"
      >
        Click me
      </button>
      <ChildRender />
    </div>
  );
};

export default TestRendeer;
