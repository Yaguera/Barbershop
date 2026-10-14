"use client";

import { AdminCalendarView } from "@/components/admin/AdminCalendarView";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Suspense } from "react";

export default function AdminCalendarioPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      <AdminNavbar activePage="calendario" />

      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-7xl">
        <Suspense
          fallback={
            <p role="status" className="py-16 text-center text-zinc-300">
              Carregando calendário…
            </p>
          }
        >
          <AdminCalendarView />
        </Suspense>
      </main>
    </div>
  );
}
