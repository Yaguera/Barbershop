'use client';

import { AdminCalendarView } from '@/components/admin/AdminCalendarView';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Scissors, Users } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/AdminNavbar';

export default function AdminCalendarioPage() {
  return (
    <div className="min-h-screen bg-preto-classico text-off-white flex flex-col">
      <AdminNavbar activePage="calendario" />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        <AdminCalendarView />
      </main>
    </div>
  );
}
