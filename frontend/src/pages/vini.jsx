import { useState } from 'react';
import FloatingButton from '../components/vini/FloatingButton';
import ChatWidget from '../components/vini/ChatWidget';

export default function ViniPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FloatingButton isOpen={isOpen} setIsOpen={setIsOpen} />
      <ChatWidget isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
}
