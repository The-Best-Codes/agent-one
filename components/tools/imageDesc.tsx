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
  url: string;
  isLoading?: boolean;
  results?: { description: string | null };
}

export const ImageDesc: React.FC<ImageDescProps> = ({
  url,
  isLoading,
  results,
}) => {
  return (
    <div className="border rounded-xl p-0 px-2 my-4 motion-preset-blur-right">
      <div className="flex w-full">
        {isLoading ? (
          <div className="py-2 flex flex-row space-x-2">
            <Loader className="w-6 h-6 min-w-6 min-h-6" />
            <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
              Viewing image at{" "}
              <Link
                href={url}
                target="_blank"
                className="text-blue-500 cursor-pointer"
              >
                {url}
              </Link>
            </p>
          </div>
        ) : results?.description ? (
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
                    href={url}
                    target="_blank"
                    className="text-blue-500 cursor-pointer"
                  >
                    {url}
                  </Link>
                </div>
              </AccordionTrigger>
              <AccordionContent className="overflow-auto max-h-64">
                <div className="rounded-xl mt-2 p-0 px-2">
                  <Image
                    src={url}
                    alt={results?.description || ""}
                    className="mt-2 w-fit max-w-full rounded-xl"
                    width={1024}
                    height={1024}
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    {results?.description || "No description available"}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <>
            <ImageIcon className="w-6 h-6 min-w-6 min-h-6 text-gray-500" />
            <p className="text-base font-medium max-w-full overflow-auto whitespace-nowrap">
              Viewed image at{" "}
              <Link
                href={url}
                target="_blank"
                className="text-blue-500 cursor-pointer"
              >
                {url}
              </Link>
            </p>
            <p className="text-sm text-gray-500 mt-2">No description found.</p>
          </>
        )}
      </div>
    </div>
  );
};
