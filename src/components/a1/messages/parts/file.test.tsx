import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessagePartFile } from "./file";

describe("MessagePartFile", () => {
  describe("Image files", () => {
    it("renders image file", () => {
      const file = {
        url: "https://example.com/image.jpg",
        mediaType: "image/jpeg",
        filename: "test-image.jpg",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/image.jpg");
      expect(img).toHaveAttribute("alt", "test-image.jpg");
    });

    it("renders image without filename", () => {
      const file = {
        url: "https://example.com/image.png",
        mediaType: "image/png",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Attached image");
    });

    it("displays image filename", () => {
      const file = {
        url: "https://example.com/image.jpg",
        mediaType: "image/jpeg",
        filename: "vacation-photo.jpg",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      expect(screen.getByText("vacation-photo.jpg")).toBeInTheDocument();
    });

    it("renders FileImageIcon for images", () => {
      const file = {
        url: "https://example.com/image.jpg",
        mediaType: "image/jpeg",
        filename: "test.jpg",
      };
      
      const { container } = render(<MessagePartFile file={file as any} />);
      
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("PDF files", () => {
    it("renders PDF file with iframe", () => {
      const file = {
        url: "https://example.com/document.pdf",
        mediaType: "application/pdf",
        filename: "document.pdf",
      };
      
      const { container } = render(<MessagePartFile file={file as any} />);
      
      const iframe = container.querySelector("iframe");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute("src", "https://example.com/document.pdf");
      expect(iframe).toHaveAttribute("title", "document.pdf");
    });

    it("displays PDF label", () => {
      const file = {
        url: "https://example.com/doc.pdf",
        mediaType: "application/pdf",
        filename: "doc.pdf",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      expect(screen.getByText(/PDF/i)).toBeInTheDocument();
    });

    it("renders PDF without filename", () => {
      const file = {
        url: "https://example.com/doc.pdf",
        mediaType: "application/pdf",
      };
      
      const { container } = render(<MessagePartFile file={file as any} />);
      
      const iframe = container.querySelector("iframe");
      expect(iframe).toHaveAttribute("title", "PDF Document");
    });
  });

  describe("Text files", () => {
    it("renders text file", () => {
      const file = {
        url: "https://example.com/doc.txt",
        mediaType: "text/plain",
        filename: "notes.txt",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      expect(screen.getByText("notes.txt")).toBeInTheDocument();
      expect(screen.getByText("Text")).toBeInTheDocument();
    });

    it("renders JSON file as text", () => {
      const file = {
        url: "https://example.com/data.json",
        mediaType: "application/json",
        filename: "data.json",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      expect(screen.getByText("Text")).toBeInTheDocument();
    });

    it("renders XML file as text", () => {
      const file = {
        url: "https://example.com/data.xml",
        mediaType: "application/xml",
        filename: "data.xml",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      expect(screen.getByText("Text")).toBeInTheDocument();
    });

    it("renders FileTextIcon for text files", () => {
      const file = {
        url: "https://example.com/doc.txt",
        mediaType: "text/plain",
        filename: "doc.txt",
      };
      
      const { container } = render(<MessagePartFile file={file as any} />);
      
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });
  });

  describe("Other file types", () => {
    it("renders generic file", () => {
      const file = {
        url: "https://example.com/file.zip",
        mediaType: "application/zip",
        filename: "archive.zip",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      expect(screen.getByText("archive.zip")).toBeInTheDocument();
      expect(screen.getByText("ZIP")).toBeInTheDocument();
    });

    it("renders file without filename", () => {
      const file = {
        url: "https://example.com/file.unknown",
        mediaType: "application/octet-stream",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      expect(screen.getByText("Attached file")).toBeInTheDocument();
    });

    it("displays FILE label when media type is unknown", () => {
      const file = {
        url: "https://example.com/file",
        filename: "unknown.file",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      expect(screen.getByText("FILE")).toBeInTheDocument();
    });

    it("displays media type", () => {
      const file = {
        url: "https://example.com/file.mp3",
        mediaType: "audio/mpeg",
        filename: "song.mp3",
      };
      
      render(<MessagePartFile file={file as any} />);
      
      expect(screen.getByText("audio/mpeg")).toBeInTheDocument();
    });

    it("truncates long filename", () => {
      const file = {
        url: "https://example.com/file.txt",
        mediaType: "text/plain",
        filename: "very-long-filename-that-should-be-truncated.txt",
      };
      
      const { container } = render(<MessagePartFile file={file as any} />);
      
      const filenameSpan = container.querySelector('[title]');
      expect(filenameSpan).toHaveClass("truncate");
    });
  });
});
