import { Suspense } from 'react';
import MessagesContent from './MessagesContent';

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
