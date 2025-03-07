"use client";

import { Loader } from "@/components/a1/smooth-loader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ImageDescProps {
  args: { url: string };
  isLoading?: boolean;
  results?: { description: string | null };
}

export const ImageDesc: React.FC<ImageDescProps> = ({
  args,
  isLoading,
  results,
}) => {
  return (
    <div className="border rounded-md p-0 px-2 motion-preset-blur-right">
      <div className="flex w-full">
        {isLoading ? (
          <div className="py-2 flex flex-row space-x-2 w-full">
            <Loader className="w-6 h-6 min-w-6 min-h-6" />
            <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
              Viewing image at{" "}
              <Link
                href={args.url}
                target="_blank"
                className="text-blue-500 cursor-pointer"
              >
                {args.url}
              </Link>
            </p>
          </div>
        ) : (
          <Accordion
            className="w-full"
            type="single"
            collapsible
            defaultValue={undefined}
          >
            <AccordionItem
              className="border-none w-full"
              value="image-description"
            >
              <AccordionTrigger className="text-base w-full py-2 font-medium">
                <div className="flex flex-row w-fit">
                  <ImageIcon className="w-6 h-6 min-w-6 min-h-6 mr-2" />
                  Viewed image at{" "}
                  <Link
                    href={args.url}
                    target="_blank"
                    className="text-blue-500 cursor-pointer max-w-64 truncate"
                  >
                    {args.url}
                  </Link>
                </div>
              </AccordionTrigger>
              <AccordionContent className="overflow-auto max-h-64">
                <div className="rounded-md mt-2 p-0 px-2">
                  {results?.description ? (
                    <>
                      <Image
                        src={args.url}
                        alt={results?.description || ""}
                        className="mt-2 w-fit max-w-full rounded-md"
                        width={1024}
                        height={1024}
                      />
                      <p className="mt-2 text-sm text-gray-600">
                        {results?.description || "No description available"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No description found.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
};
