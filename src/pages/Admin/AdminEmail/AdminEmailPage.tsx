import { useState } from 'react';
import EmailTypePanel from './EmailTypePanel'
import EmailUserPanel from './EmailUserPane'
import EmailMessagePanel from './EmailMessagePanel'

const AdminEmailPage = () => {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  return (
    <div className="p-6 space-y-6">
      <EmailTypePanel
        selectedTypeId={selectedTypeId}
        onSelect={(id: number) => {
          setSelectedTypeId(id);
          setSelectedUserId(null);
        }}
      />

      {selectedTypeId && (
        <EmailUserPanel
          typeId={selectedTypeId}
          selectedUserId={selectedUserId}
          onSelect={setSelectedUserId}
        />
      )}

      {selectedUserId && (
        <EmailMessagePanel userId={selectedUserId} />
      )}
    </div>
  );
};

export default AdminEmailPage;
