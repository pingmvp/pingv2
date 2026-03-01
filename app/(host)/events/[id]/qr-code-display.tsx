"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props {
  url: string;
}

export function QRCodeDisplay({ url }: Props) {
  const [downloaded, setDownloaded] = useState(false);

  function handleDownload() {
    const svg = document.getElementById("ping-qr-svg")?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "ping-attendee-qr.svg";
    link.click();
    URL.revokeObjectURL(objectUrl);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }

  return (
    <div className="flex items-start gap-5">
      {/* QR code */}
      <div
        id="ping-qr-svg"
        className="shrink-0 bg-white p-3 rounded-xl border shadow-sm"
      >
        <QRCode value={url} size={120} />
      </div>

      {/* Label + actions */}
      <div className="space-y-2 pt-1">
        <p className="text-sm font-medium">QR code</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Display at your event or embed in invites. Attendees scan to open the questionnaire instantly.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          {downloaded ? "Downloaded!" : "Download SVG"}
        </Button>
      </div>
    </div>
  );
}
