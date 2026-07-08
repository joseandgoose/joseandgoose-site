import type { Metadata } from "next";
import WorkClient from "./WorkClient";

export const metadata: Metadata = {
  title: "Work & Projects — Jose and Goose",
  description:
    "Education, finance, strategy, and product — plus the AI tools, games, and automations built on this site.",
};

export default function Page() {
  return <WorkClient />;
}
