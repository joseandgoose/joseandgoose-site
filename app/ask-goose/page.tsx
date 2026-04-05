import AskGooseChat from "@/app/components/AskGooseChat";

export const metadata = {
  title: "Ask Goose — Jose and Goose",
  description:
    "Chat with Goose, an AI assistant that knows about Jose's career, projects, writing, and the tech behind joseandgoose.com.",
};

export default function AskGoosePage() {
  return (
    <>
      <div className="page-header">
        <h1>Ask Goose</h1>
        <p className="tagline">
          AI-powered chat — ask anything about Jose, his work, or this site
        </p>
      </div>

      <AskGooseChat />
    </>
  );
}
