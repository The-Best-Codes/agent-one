import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("Alert Components", () => {
  describe("Alert", () => {
    it("renders correctly", () => {
      render(<Alert>Alert content</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("has correct role attribute", () => {
      render(<Alert>Content</Alert>);
      expect(screen.getByRole("alert")).toHaveAttribute("data-slot", "alert");
    });

    it("renders with default variant", () => {
      render(<Alert variant="default">Default alert</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("renders with destructive variant", () => {
      render(<Alert variant="destructive">Destructive alert</Alert>);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      render(<Alert className="custom-class">Content</Alert>);
      expect(screen.getByRole("alert")).toHaveClass("custom-class");
    });

    it("forwards additional props", () => {
      render(<Alert data-testid="test-alert">Content</Alert>);
      expect(screen.getByTestId("test-alert")).toBeInTheDocument();
    });
  });

  describe("AlertTitle", () => {
    it("renders correctly", () => {
      render(<AlertTitle>Alert Title</AlertTitle>);
      expect(screen.getByText("Alert Title")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<AlertTitle>Title</AlertTitle>);
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<AlertTitle className="custom-class">Title</AlertTitle>);
      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toHaveClass("custom-class");
    });
  });

  describe("AlertDescription", () => {
    it("renders correctly", () => {
      render(<AlertDescription>Alert description</AlertDescription>);
      expect(screen.getByText("Alert description")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<AlertDescription>Description</AlertDescription>);
      const description = container.querySelector('[data-slot="alert-description"]');
      expect(description).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <AlertDescription className="custom-class">Description</AlertDescription>
      );
      const description = container.querySelector('[data-slot="alert-description"]');
      expect(description).toHaveClass("custom-class");
    });
  });

  describe("Full Alert Structure", () => {
    it("renders complete alert with title and description", () => {
      render(
        <Alert>
          <AlertTitle>Error Occurred</AlertTitle>
          <AlertDescription>
            There was a problem processing your request.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Error Occurred")).toBeInTheDocument();
      expect(screen.getByText("There was a problem processing your request.")).toBeInTheDocument();
    });

    it("renders destructive alert with complete structure", () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Critical Error</AlertTitle>
          <AlertDescription>
            This is a critical error message.
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Critical Error")).toBeInTheDocument();
      expect(screen.getByText("This is a critical error message.")).toBeInTheDocument();
    });

    it("renders alert with icon", () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>With Icon</AlertTitle>
          <AlertDescription>Alert with icon</AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
      expect(screen.getByText("With Icon")).toBeInTheDocument();
    });
  });
});
