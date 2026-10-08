import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { formatTime, formatDate } from "@/lib/format";

const tones = { scheduled: "brand", in_progress: "accent", completed: "slate", canceled: "red" } as const;

type BookingRow = {
  id: string;
  booking_number: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  recurrence: string;
  customers: { name: string } | null;
  service_addresses: { address_line1: string; city: string } | null;
};

function BookingList({ bookings, tz }: { bookings: BookingRow[]; tz: string }) {
  return (
    <ul className="divide-y divide-slate-100">
      {bookings.map((b) => (
        <li key={b.id}>
          <Link href={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">
                {b.booking_number} · {b.customers?.name}
              </p>
              <p className="text-sm text-slate-500">
                {formatDate(b.scheduled_start)}, {formatTime(b.scheduled_start, tz)} – {formatTime(b.scheduled_end, tz)}
                {" · "}{b.service_addresses?.address_line1}, {b.service_addresses?.city}
                {b.recurrence !== "none" && ` · repeats ${b.recurrence}`}
              </p>
            </div>
            <Badge tone={tones[b.status as keyof typeof tones] ?? "slate"}>
              {b.status.replace("_", " ")}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function BookingsPage() {
  const { company } = await requireCompany();
  const supabase = await createClient();
  const tz = company.timezone || "America/New_York";
  const now = new Date().toISOString();

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, booking_number, scheduled_start, scheduled_end, status, recurrence, customers(name), service_addresses(address_line1, city)",
    )
    .eq("company_id", company.id)
    .order("scheduled_start", { ascending: true });

  const all = (bookings ?? []) as unknown as BookingRow[];
  const upcoming = all.filter((b) => b.scheduled_start >= now && b.status !== "canceled");
  const past = all.filter((b) => !(b.scheduled_start >= now && b.status !== "canceled"));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading title="Bookings" description="Scheduled cleanings and their visits." />
        <Button href="/dashboard/bookings/new">
          <PlusIcon className="h-4 w-4" /> New booking
        </Button>
      </div>

      {all.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No bookings yet"
              description="Book a cleaning and its job visits will be generated automatically."
              action={<Button href="/dashboard/bookings/new">New booking</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming ({upcoming.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {upcoming.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-500">Nothing upcoming.</p>
              ) : (
                <BookingList bookings={upcoming} tz={tz} />
              )}
            </CardContent>
          </Card>
          {past.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past & canceled ({past.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <BookingList bookings={past} tz={tz} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
