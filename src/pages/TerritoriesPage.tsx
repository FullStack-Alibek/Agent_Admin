import React from 'react';
import { ComingSoon } from './ComingSoon';

export const TerritoriesPage: React.FC = () => (
  <ComingSoon
    title="Hududlar & Marshrutlar"
    description="Agentlar uchun geografik hududlar, marshrutlar va biriktirishlar boshqaruvi."
    features={[
      'Hududlarni (viloyat/tuman) xarita ustida belgilash',
      'Agentlarga hududlarni biriktirish',
      'Kunlik marshrutlarni rejalashtirish',
      'Tashrif nuqtalari (do\'konlar) ketma-ketligi',
    ]}
  />
);
