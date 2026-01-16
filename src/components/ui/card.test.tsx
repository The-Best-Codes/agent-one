import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card Components", () => {
  describe("Card", () => {
    it("renders correctly", () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("custom-class");
    });

    it("forwards additional props", () => {
      render(<Card data-testid="test-card">Content</Card>);
      expect(screen.getByTestId("test-card")).toBeInTheDocument();
    });
  });

  describe("CardHeader", () => {
    it("renders correctly", () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<CardHeader className="custom-class">Content</CardHeader>);
      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toHaveClass("custom-class");
    });
  });

  describe("CardTitle", () => {
    it("renders correctly", () => {
      render(<CardTitle>Title text</CardTitle>);
      expect(screen.getByText("Title text")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardTitle>Title</CardTitle>);
      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<CardTitle className="custom-class">Title</CardTitle>);
      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toHaveClass("custom-class");
    });
  });

  describe("CardDescription", () => {
    it("renders correctly", () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText("Description text")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardDescription>Description</CardDescription>);
      const description = container.querySelector('[data-slot="card-description"]');
      expect(description).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(
        <CardDescription className="custom-class">Description</CardDescription>
      );
      const description = container.querySelector('[data-slot="card-description"]');
      expect(description).toHaveClass("custom-class");
    });
  });

  describe("CardAction", () => {
    it("renders correctly", () => {
      render(<CardAction>Action content</CardAction>);
      expect(screen.getByText("Action content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardAction>Action</CardAction>);
      const action = container.querySelector('[data-slot="card-action"]');
      expect(action).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<CardAction className="custom-class">Action</CardAction>);
      const action = container.querySelector('[data-slot="card-action"]');
      expect(action).toHaveClass("custom-class");
    });
  });

  describe("CardContent", () => {
    it("renders correctly", () => {
      render(<CardContent>Content text</CardContent>);
      expect(screen.getByText("Content text")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<CardContent className="custom-class">Content</CardContent>);
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toHaveClass("custom-class");
    });
  });

  describe("CardFooter", () => {
    it("renders correctly", () => {
      render(<CardFooter>Footer content</CardFooter>);
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toBeInTheDocument();
    });

    it("accepts custom className", () => {
      const { container } = render(<CardFooter className="custom-class">Footer</CardFooter>);
      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toHaveClass("custom-class");
    });
  });

  describe("Full Card Structure", () => {
    it("renders complete card structure", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Main content</CardContent>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );

      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Card Description")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
      expect(screen.getByText("Main content")).toBeInTheDocument();
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });
  });
});
