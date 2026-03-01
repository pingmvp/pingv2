interface Props {
  params: Promise<{ token: string }>;
}

export default async function FeedbackPage({ params }: Props) {
  const { token } = await params;

  // TODO Sprint 5: fetch attendee matches by token, render feedback form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-center">
          How were your matches?
        </h1>
        <p className="text-muted-foreground text-center text-sm">
          Token: {token}
        </p>
        {/* Feedback form — TODO Sprint 5 */}
      </div>
    </div>
  );
}
