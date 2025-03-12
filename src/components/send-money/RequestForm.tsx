
import React from 'react';
import { CardCustom, CardHeader, CardTitle, CardContent } from '@/components/ui/card-custom';

const RequestForm = () => {
  return (
    <CardCustom className="glass-card">
      <CardHeader>
        <CardTitle>Request Movals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center mb-4">
            This feature is coming soon! You'll be able to request Movals from other users.
          </p>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">👷</span>
          </div>
        </div>
      </CardContent>
    </CardCustom>
  );
};

export default RequestForm;
