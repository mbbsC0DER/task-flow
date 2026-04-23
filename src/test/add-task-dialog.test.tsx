import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@/App";

describe("Add task dialog", () => {
  it("creates one task per non-empty line in bulk mode", async () => {
    window.history.pushState({}, "", "/today");

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /add task/i }));
    fireEvent.click(screen.getByRole("button", { name: /create multiple/i }));

    fireEvent.change(screen.getByLabelText(/enter one task per line/i), {
      target: {
        value: "help customer\n   \nprepare report\n\nreview blockers   ",
      },
    });

    expect(screen.getByText(/3 tasks detected/i)).toBeInTheDocument();
    expect(screen.getByText(/editable preview/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^create task$/i }));

    expect(await screen.findByText("help customer")).toBeInTheDocument();
    expect(screen.getByText("prepare report")).toBeInTheDocument();
    expect(screen.getByText("review blockers")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }, 20000);
});
