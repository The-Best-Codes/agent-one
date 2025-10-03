import { ArrowLeftIcon, HomeIcon } from "lucide-react";
import { useNavigate } from "react-router";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const credits = [
  {
    id: "fnm",
    title: "fnm (Fast Node Manager)",
    content: (
      <div>
        <p>
          This application uses fnm for Node.js version management during
          onboarding. fnm is licensed under the GNU General Public License v3.0.
        </p>
        <p className="mt-2">
          For the complete license text, visit{" "}
          <a
            href="https://github.com/Schniz/fnm"
            className="text-blue-500 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            the fnm repository
          </a>
          .
        </p>
        <p className="mt-2">
          Source code access: Contact us for the complete corresponding source
          code for the bundled fnm binary.
        </p>
      </div>
    ),
  },
];

export default function CreditsRoute() {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-2xl p-6">
        <div className="relative mb-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-0 left-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="sr-only md:not-sr-only">Back</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute top-0 right-0"
            onClick={() => navigate("/chat")}
          >
            <HomeIcon className="h-4 w-4" />
            <span className="sr-only md:not-sr-only">Home</span>
          </Button>
          <h1 className="text-2xl font-bold">Credits</h1>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {credits.map((credit) => (
            <AccordionItem key={credit.id} value={credit.id}>
              <AccordionTrigger>{credit.title}</AccordionTrigger>
              <AccordionContent>{credit.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
