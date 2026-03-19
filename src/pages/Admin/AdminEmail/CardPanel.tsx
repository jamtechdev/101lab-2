

export const CardPanel = ({ title, children }) => {
  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
};


