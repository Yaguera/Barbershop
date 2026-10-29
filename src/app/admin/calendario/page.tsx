"use client";

import { AdminCalendarView } from "@/components/admin/AdminCalendarView";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Suspense } from "react";

export default function AdminCalendarioPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] lg:bg-[#141416] text-white flex flex-col lg:flex-row">
      <AdminNavbar activePage="calendario" />

      <main
        id="main-content"
        className="flex-grow px-4 py-6 sm:px-6 sm:py-8 lg:my-3 lg:mr-3 lg:flex-1 lg:min-w-0 lg:rounded-[24px] lg:border lg:border-white/[0.07] lg:bg-[#0A0A0C] lg:p-6 xl:p-8 lg:shadow-2xl"
      >
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
