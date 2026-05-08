import { db } from "@/lib/db";
import { attendees } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Check } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SurveyDonePage({ params }: Props) {
  const { token } = await params;

  const [attendee] = await db
    .select({ name: attendees.name })
    .from(attendees)
    .where(eq(attendees.token, token));

  const firstName = attendee?.name.split(" ")[0] ?? null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
          <Check className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {firstName ? `Thanks, ${firstName}!` : "Thanks!"}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Your feedback has been received. We use it to keep improving the
            experience.
          </p>
        </div>
      </div>
    </div>
  );
}
