// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KidNavigationFeedbackProvider, useKidNavigationFeedback } from "@/components/kid-navigation-feedback";

const pushMock = vi.fn();
const replaceMock = vi.fn();

let pathnameValue = "/kid/courses";
let queryValue = "childId=child-1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => pathnameValue,
  useSearchParams: () => new URLSearchParams(queryValue),
}));

function Harness() {
  const { navigate, isNavigating, pendingTarget } = useKidNavigationFeedback();

  return (
    <div>
      <button type="button" onClick={() => navigate("/kid/garden?childId=child-1")}>
        Navigate
      </button>
      <p data-testid="is-navigating">{String(isNavigating)}</p>
      <p data-testid="pending-target">{pendingTarget ?? ""}</p>
    </div>
  );
}

describe("KidNavigationFeedbackProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    pathnameValue = "/kid/courses";
    queryValue = "childId=child-1";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets navigating state immediately and calls router.push once", () => {
    render(
      <KidNavigationFeedbackProvider>
        <Harness />
      </KidNavigationFeedbackProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Navigate" }));
    fireEvent.click(screen.getByRole("button", { name: "Navigate" }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/kid/garden?childId=child-1");
    expect(screen.getByTestId("is-navigating")).toHaveTextContent("true");
    expect(screen.getByTestId("pending-target")).toHaveTextContent("/kid/garden?childId=child-1");
  });

  it("shows top bar then overlay only after configured delay", () => {
    vi.useFakeTimers();
    render(
      <KidNavigationFeedbackProvider>
        <Harness />
      </KidNavigationFeedbackProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Navigate" }));

    expect(document.querySelector(".kid-nav-feedback-topbar")).toBeNull();
    expect(screen.queryByText("Đang mở trang mới...")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(document.querySelector(".kid-nav-feedback-topbar")).not.toBeNull();
    expect(screen.queryByText("Đang mở trang mới...")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(screen.getByText("Đang mở trang mới...")).toBeInTheDocument();
  });

  it("completes pending state when route key changes", async () => {
    const { rerender } = render(
      <KidNavigationFeedbackProvider>
        <Harness />
      </KidNavigationFeedbackProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Navigate" }));
    expect(screen.getByTestId("is-navigating")).toHaveTextContent("true");

    pathnameValue = "/kid/garden";
    queryValue = "childId=child-1";
    rerender(
      <KidNavigationFeedbackProvider>
        <Harness />
      </KidNavigationFeedbackProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-navigating")).toHaveTextContent("false");
    });
  });
});
