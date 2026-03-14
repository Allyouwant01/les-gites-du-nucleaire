import { Suspense } from 'react';
import ListingsContent from './ListingsContent';

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
