import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function AboutSection() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Information about this application and its dependencies.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credits and Licenses</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {credits.map((credit) => (
              <AccordionItem key={credit.id} value={credit.id}>
                <AccordionTrigger>{credit.title}</AccordionTrigger>
                <AccordionContent>{credit.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
