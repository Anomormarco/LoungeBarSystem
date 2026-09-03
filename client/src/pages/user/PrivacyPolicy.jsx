import React from 'react';
import UserLayout from '../../components/UserLayout';
import { PRIVACY_POLICY } from '../../content/legalContent';

export default function PrivacyPolicy() {
  return (
    <UserLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-lounge-accent">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">{PRIVACY_POLICY.title}</h1>
        <p className="mt-2 text-sm text-lounge-muted">Сүүлд шинэчилсэн: {PRIVACY_POLICY.updated}</p>

        <div className="mt-8 space-y-8">
          {PRIVACY_POLICY.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-lounge-accent">{section.heading}</h2>
              <div className="mt-2 space-y-2">
                {section.body.map((paragraph, index) => (
                  <p key={index} className="text-sm leading-relaxed text-lounge-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </UserLayout>
  );
}
