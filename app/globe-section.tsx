"use client";

import dynamic from "next/dynamic";

const GlobeHeroSection = dynamic(() => import("./globe-hero"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center"
      style={{
        height: "100vh",
        background: "linear-gradient(to bottom, #050816 0%, #081225 55%, #0d1a38 100%)",
      }}
    />
  ),
});

export default function GlobeSection() {
  return <GlobeHeroSection />;
}
