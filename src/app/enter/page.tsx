import type { Metadata } from "next";
import EnterForm from "./EnterForm";

/**
 * THE ENTRY SCREEN.
 *
 * This is the first surface anyone sees, including people David hands the URL to on
 * a call, so it is built to the same standard as the site behind it rather than as
 * a utility page.
 *
 * It says the brand and nothing else. No product claims, no metrics, no payer or
 * rate language, no "coming soon" — an unauthenticated visitor should learn nothing
 * about what is behind the door beyond who owns it.
 */
export const metadata: Metadata = {
  title: "Enter",
  description: "",
  robots: { index: false, follow: false, nocache: true },
};

export default function EnterPage() {
  return <EnterForm />;
}
