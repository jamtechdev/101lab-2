// Option A: Add to a BuyerLayout component
import { Outlet } from 'react-router-dom';
import AISupportChat from './AiChat'

export default function BuyerLayout({ children }: { children?: any }) {



  return (
    <>
      <Outlet />
      {/* <AISupportChat /> */}
    </>
  );
}
