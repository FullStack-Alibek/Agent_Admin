import React from 'react';
import { ComingSoon } from './ComingSoon';

export const GpsPage: React.FC = () => (
  <ComingSoon
    title="GPS Kuzatuv"
    description="Kuryerlar va agentlarning real vaqtda joylashuvini kuzatish."
    features={[
      'Kuryerlar joylashuvini xarita ustida real vaqtda ko\'rish',
      'Agentlar harakat trayektoriyasi (track history)',
      'Geofencing va ogohlantirishlar',
      'Marshrutdan chetlanishni aniqlash',
    ]}
  />
);
